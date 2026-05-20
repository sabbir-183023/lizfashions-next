// app/api/v1/orders/route.js (updated with coupon deduction)
import { NextResponse } from "next/server";
import { connectToDatabase, withPrimaryWrite } from "@/app/lib/mongodb";
import Order from "@/app/models/Order";
import Product from "@/app/models/Product";
import Inventory from "@/app/models/Inventory";
import Sale from "@/app/models/Sale";
import Coupon from "@/app/models/Coupon"; // IMPORTANT: Add this import
import mongoose from "mongoose";

// Helper function to generate order number with retry
const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const startOfDay = new Date(year, month - 1, day);
  const endOfDay = new Date(year, month - 1, day + 1);

  const todayOrdersCount = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  const sequence = String(todayOrdersCount + 1).padStart(4, "0");
  return `ORD-${year}${month}${day}-${sequence}`;
};

// Helper function to process order items (deduct inventory/product and create sale records)
const processOrderItems = async (
  items,
  orderId,
  deliveryCharge,
  discount,
  orderDate,
  couponDiscountPerUnit = 0,
) => {
  const results = {
    success: true,
    errors: [],
    updatedProducts: [],
    updatedInventory: [],
    saleRecords: [],
  };

  const totalProductsInOrder = items.reduce(
    (sum, item) => sum + item.selectedQuantity,
    0,
  );
  const avgDeliveryCharge = deliveryCharge / totalProductsInOrder;
  const avgDiscount = discount / totalProductsInOrder;

  for (const item of items) {
    try {
      // 1. Update Product quantity
      const product = await Product.findById(item._id);
      if (!product) {
        results.errors.push(`Product not found: ${item.name}`);
        results.success = false;
        continue;
      }

      if (product.quantity < item.selectedQuantity) {
        results.errors.push(
          `Insufficient stock for product: ${item.name}. Available: ${product.quantity}, Requested: ${item.selectedQuantity}`,
        );
        results.success = false;
        continue;
      }

      product.quantity -= item.selectedQuantity;
      await product.save();
      results.updatedProducts.push({
        id: product._id,
        name: product.name,
        oldQuantity: product.quantity + item.selectedQuantity,
        newQuantity: product.quantity,
        deducted: item.selectedQuantity,
      });

      // 2. Find inventory and update quantity, also get purchase details
      let inventory = null;

      // Try to find by product inventory reference
      if (product.inventory) {
        inventory = await Inventory.findById(product.inventory);
      }

      // If not found, try by barcode/SKU
      if (!inventory && item.SKU) {
        inventory = await Inventory.findOne({ barcode: item.SKU });
      }

      if (inventory) {
        if (inventory.currentQty < item.selectedQuantity) {
          results.errors.push(
            `Insufficient inventory stock for: ${item.name}. Available: ${inventory.currentQty}, Requested: ${item.selectedQuantity}`,
          );
          results.success = false;
          continue;
        }

        inventory.currentQty -= item.selectedQuantity;
        await inventory.save();
        results.updatedInventory.push({
          id: inventory._id,
          name: inventory.productName,
          barcode: inventory.barcode,
          oldQuantity: inventory.currentQty + item.selectedQuantity,
          newQuantity: inventory.currentQty,
          deducted: item.selectedQuantity,
        });

        // 3. Create Sale record for each product unit
        const productDeliveryCharge = avgDeliveryCharge * item.selectedQuantity;
        const productDiscount = avgDiscount * item.selectedQuantity;
        const productCouponDiscount = couponDiscountPerUnit * item.selectedQuantity;

        for (let qty = 0; qty < item.selectedQuantity; qty++) {
          const perUnitDeliveryCharge =
            productDeliveryCharge / item.selectedQuantity;
          const perUnitDiscount = productDiscount / item.selectedQuantity;
          const perUnitCouponDiscount = productCouponDiscount / item.selectedQuantity;
          
          // Total discount includes both sale discount and coupon discount
          const totalDiscountPerUnit = perUnitDiscount + perUnitCouponDiscount;
          
          const profit =
            item.sellingPrice -
            totalDiscountPerUnit -
            inventory.CPP -
            inventory.purchaseRate;

          const saleRecord = await Sale.create({
            orderId: orderId,
            inventoryId: inventory._id,
            productName: item.name,
            purchasePrice: inventory.purchaseRate,
            CPP: inventory.CPP,
            totalDiscount: totalDiscountPerUnit,
            totalProductsInOrder: 1,
            deliveryCharge: perUnitDeliveryCharge,
            sellPrice: item.sellingPrice,
            profit: profit,
            date: orderDate,
            remarks: `Public order - customer: ${orderId}`,
          });

          results.saleRecords.push({
            id: saleRecord._id,
            productName: item.name,
            sellPrice: item.sellingPrice,
            profit: profit,
          });
        }
      } else {
        results.errors.push(`Inventory not found for product: ${item.name}`);
        results.success = false;
      }
    } catch (error) {
      console.error(`Error processing item ${item.name}:`, error);
      results.errors.push(`Error processing ${item.name}: ${error.message}`);
      results.success = false;
    }
  }

  return results;
};

// POST - Create a new order
export async function POST(request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const {
      items,
      customer,
      subtotal,
      deliveryCharge,
      discount,
      total,
      couponCode,
    } = body;

    // Your existing validations...
    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cart is empty",
        },
        { status: 400 },
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer information is required",
        },
        { status: 400 },
      );
    }

    const requiredCustomerFields = [
      "name",
      "district",
      "policeStation",
      "address",
      "phone",
    ];
    for (const field of requiredCustomerFields) {
      if (!customer[field] || customer[field].toString().trim() === "") {
        return NextResponse.json(
          {
            success: false,
            message: `${field} is required`,
          },
          { status: 400 },
        );
      }
    }

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(customer.phone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number format. Use 01XXXXXXXXX",
        },
        { status: 400 },
      );
    }

    // Handle coupon validation and deduction - ADD THIS SECTION
    let finalCouponDiscount = discount;
    let couponCodeUsed = couponCode || "";
    let couponDiscountAmount = 0;
    let couponDiscountPerUnit = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
      
      if (coupon && coupon.isAvtive && coupon.couponQty > 0) {
        const now = new Date();
        const startDate = new Date(coupon.validityStart);
        const endDate = new Date(coupon.validityEnd);
        
        if (now >= startDate && now <= endDate) {
          // Check if dedicated to specific user
          if (coupon.dedicatedUserPhone && coupon.dedicatedUserPhone.trim() !== "") {
            if (!customer.phone || customer.phone.trim() === "") {
              return NextResponse.json({
                success: false,
                message: "Phone number is required to use this coupon"
              }, { status: 400 });
            }
            
            if (coupon.dedicatedUserPhone !== customer.phone) {
              return NextResponse.json({
                success: false,
                message: "This coupon is only valid for a specific user"
              }, { status: 400 });
            }
          }
          
          // DEDUCT COUPON QUANTITY
          coupon.couponQty -= 1;
          await coupon.save();
          
          couponDiscountAmount = coupon.discountAmount;
          finalCouponDiscount = couponDiscountAmount;
          couponCodeUsed = coupon.couponCode;
          
          console.log(`Coupon ${couponCode} used. Remaining quantity: ${coupon.couponQty}`);
        } else {
          return NextResponse.json({
            success: false,
            message: "Coupon has expired",
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({
          success: false,
          message: "Invalid or expired coupon",
        }, { status: 400 });
      }
    }

    // Calculate per-unit coupon discount for sale records
    const totalProductsInOrder = items.reduce(
      (sum, item) => sum + item.selectedQuantity,
      0,
    );
    couponDiscountPerUnit = totalProductsInOrder > 0 && finalCouponDiscount > 0
      ? finalCouponDiscount / totalProductsInOrder
      : 0;

    // Calculate final total
    const finalTotal = subtotal + deliveryCharge - finalCouponDiscount;

    // Generate order number
    const orderNumber = await generateOrderNumber();
    const orderDate = new Date();

    // Prepare order data
    const orderData = {
      products: items.map((item) => ({
        productId: item._id,
        name: item.name,
        SKU: item.SKU,
        sellingPrice: item.sellingPrice,
        originalPrice: item.originalPrice,
        amount: item.selectedQuantity,
        photos: item.photos,
        slug: item.slug,
        maxQuantity: item.maxQuantity,
      })),
      payment: {
        method: "Cash on Delivery",
        status: "Pending",
        amount: finalTotal,
      },
      lastNumber: orderNumber,
      subTotal: subtotal,
      customer: {
        name: customer.name,
        district: customer.district,
        policeStation: customer.policeStation,
        address: customer.address,
        phone: customer.phone,
        email: customer.email || "",
      },
      deliveryCharge: deliveryCharge.toString(),
      defaultDiscount: 0,
      customDiscount: finalCouponDiscount > 0 ? finalCouponDiscount.toString() : "",
      couponCode: couponCodeUsed,
      couponDiscount: finalCouponDiscount > 0 ? finalCouponDiscount.toString() : "",
      courierTrackingId: "",
      status: "Pending Confirmation",
    };

    // Create the order
    const order = await withPrimaryWrite(async () => {
      return await Order.create(orderData);
    });

    // Process order items (deduct inventory/product and create sale records)
    const processResult = await processOrderItems(
      items,
      order._id,
      deliveryCharge,
      0, // No additional discount here since coupon is handled separately
      orderDate,
      couponDiscountPerUnit,
    );

    if (!processResult.success) {
      console.error("Order processing had errors:", processResult.errors);
      return NextResponse.json(
        {
          success: true,
          message: "Order placed but had processing warnings",
          warnings: processResult.errors,
          data: {
            orderId: order._id,
            orderNumber: order.lastNumber,
            total: finalTotal,
            status: order.status,
            orderDate: order.createdAt,
            couponDiscount: finalCouponDiscount,
            stockUpdates: {
              products: processResult.updatedProducts,
              inventory: processResult.updatedInventory,
            },
            saleRecordsCount: processResult.saleRecords.length,
          },
        },
        { status: 201 },
      );
    }

    console.log("Order created successfully:", {
      orderId: order._id,
      orderNumber: order.lastNumber,
      couponApplied: couponCodeUsed,
      couponDiscount: finalCouponDiscount,
      productUpdates: processResult.updatedProducts.length,
      inventoryUpdates: processResult.updatedInventory.length,
      saleRecords: processResult.saleRecords.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        data: {
          orderId: order._id,
          orderNumber: order.lastNumber,
          total: finalTotal,
          status: order.status,
          orderDate: order.createdAt,
          couponDiscount: finalCouponDiscount,
          stockUpdates: {
            products: processResult.updatedProducts,
            inventory: processResult.updatedInventory,
          },
          saleRecordsCount: processResult.saleRecords.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating order:", error);

    if (error.code === 10107) {
      return NextResponse.json(
        {
          success: false,
          message: "Database is currently unavailable. Please try again.",
          error: "Primary node unavailable - please retry",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to place order",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// GET - Fetch orders (optional - for admin or user order history)
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const orderId = searchParams.get("orderId");

    let query = {};

    if (phone) {
      query["customer.phone"] = phone;
    }

    if (orderId) {
      query._id = orderId;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json(
      {
        success: true,
        count: orders.length,
        orders,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      },
      { status: 500 },
    );
  }
}