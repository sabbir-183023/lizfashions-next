// app/api/v1/admin/orders/route.js
import { NextResponse } from "next/server";
import { connectToDatabase, withPrimaryWrite } from "@/app/lib/mongodb";
import Order from "@/app/models/Order";
import Product from "@/app/models/Product";
import Inventory from "@/app/models/Inventory";
import Sale from "@/app/models/Sale";
import { getAuthToken, verifyToken } from "@/app/lib/authUtils";

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

// Helper function to deduct inventory and product quantities and create sale records
const processOrderItems = async (
  items,
  orderId,
  deliveryCharge,
  discount,
  orderDate,
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
      const product = await Product.findOne(item._id);
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
        inventory = await Inventory.findById(item._id);
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

        for (let qty = 0; qty < item.selectedQuantity; qty++) {
          const profit =
            item.sellingPrice -
            avgDiscount -
            inventory.CPP -
            inventory.purchaseRate;

          const saleRecord = await Sale.create({
            orderId: orderId,
            inventoryId: inventory._id,
            productName: item.name,
            purchasePrice: inventory.purchaseRate,
            CPP: inventory.CPP,
            totalDiscount: avgDiscount,
            totalProductsInOrder: 1,
            deliveryCharge: avgDeliveryCharge,
            sellPrice: item.sellingPrice,
            profit: profit,
            date: orderDate,
            remarks: `Order #${orderId} - Unit ${qty + 1} of ${item.selectedQuantity}`,
          });

          results.saleRecords.push({
            id: saleRecord._id,
            productName: item.name,
            sellPrice: item.sellingPrice,
            profit: profit,
          });

          console.log(`Sale record created: ${saleRecord._id}`);
        }
      } else {
        console.error(`Inventory NOT found for product: ${item.name}`);
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

// POST - Create a new admin order
export async function POST(request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      items,
      customer,
      subtotal,
      deliveryCharge,
      discount,
      total,
      notes,
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No products selected",
        },
        { status: 400 },
      );
    }

    if (!customer || !customer.name) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        { status: 400 },
      );
    }

    // Generate order number first (needed for order creation)
    const orderNumber = await generateOrderNumber();
    const orderDate = new Date();

    // Prepare order data
    const orderData = {
      products: items.map((item) => ({
        productId: item._id,
        name: item.name,
        SKU: item.SKU,
        sellingPrice: item.sellingPrice,
        originalPrice: item.originalPrice || item.sellingPrice,
        amount: item.selectedQuantity,
        photos: item.photos || [],
        slug: item.slug,
        maxQuantity: item.maxQuantity,
      })),
      payment: {
        method: "Cash on Delivery",
        status: "Pending",
        amount: total,
      },
      lastNumber: orderNumber,
      subTotal: subtotal,
      customer: {
        name: customer.name,
        district: customer.district || "",
        policeStation: customer.policeStation || "",
        address: customer.address || "",
        phone: customer.phone,
        email: customer.email || "",
      },
      deliveryCharge: deliveryCharge.toString(),
      defaultDiscount: 0,
      customDiscount: discount > 0 ? discount.toString() : "",
      couponCode: "",
      couponDiscount: discount > 0 ? discount.toString() : "",
      courierTrackingId: "",
      status: "Pending Confirmation",
      notes: notes || "",
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
      discount,
      orderDate,
    );

    if (!processResult.success) {
      console.error("Order processing had errors:", processResult.errors);
      return NextResponse.json(
        {
          success: false,
          message: "Order created but had processing errors",
          errors: processResult.errors,
          orderId: order._id,
          orderNumber: order.lastNumber,
          saleRecordsCreated: processResult.saleRecords.length,
        },
        { status: 207 },
      );
    }

    // Log the results for debugging
    console.log("Admin order created successfully:", {
      orderId: order._id,
      orderNumber: order.lastNumber,
      admin: user.email || user.phone,
      productUpdates: processResult.updatedProducts.length,
      inventoryUpdates: processResult.updatedInventory.length,
      saleRecords: processResult.saleRecords.length,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Custom order created successfully",
        data: {
          orderId: order._id,
          orderNumber: order.lastNumber,
          total:
            order.subTotal +
            parseInt(order.deliveryCharge) -
            (parseInt(order.couponDiscount) || 0),
          status: order.status,
          orderDate: order.createdAt,
          stockUpdates: {
            products: processResult.updatedProducts,
            inventory: processResult.updatedInventory,
          },
          saleRecords: processResult.saleRecords,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating admin order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// GET - Fetch orders (for admin panel)
export async function GET(request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let query = {};

    if (search) {
      query.$or = [
        { "customer.name": { $regex: search, $options: "i" } },
        { "buyer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
        { "buyer.phone": { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
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
