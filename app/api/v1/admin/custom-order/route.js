// app/api/v1/admin/custom-order/route.js
import { NextResponse } from "next/server";
import { connectToDatabase, withPrimaryWrite } from "@/app/lib/mongodb";
import Order from "@/app/models/Order";
import Product from "@/app/models/Product";
import Inventory from "@/app/models/Inventory";
import Sale from "@/app/models/Sale";
import { getAuthToken, verifyToken } from "@/app/lib/authUtils";
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

// Helper function to get product by inventory ID
const getProductByInventoryId = async (inventoryId) => {
  // Find product linked to this inventory
  const product = await Product.findOne({ inventory: inventoryId });
  if (product) return product;

  // If not found, try to find by barcode/SKU
  const inventory = await Inventory.findById(inventoryId);
  if (inventory && inventory.barcode) {
    const productBySku = await Product.findOne({ SKU: inventory.barcode });
    if (productBySku) return productBySku;
  }

  return null;
};

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

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No products selected" },
        { status: 400 },
      );
    }

    if (!customer || !customer.name) {
      return NextResponse.json(
        { success: false, message: "Customer name is required" },
        { status: 400 },
      );
    }

    const totalProductsInOrder = items.reduce(
      (sum, item) => sum + item.selectedQuantity,
      0,
    );
    const avgDeliveryCharge = deliveryCharge / totalProductsInOrder;
    const avgDiscount = discount / totalProductsInOrder;

    // Array to track updates for response
    const updatedInventory = [];
    const updatedProducts = [];
    const saleRecords = [];

    // Update inventory, product quantities and create sale records
    for (const item of items) {
      const inventoryItem = await Inventory.findById(item._id);
      if (!inventoryItem) {
        return NextResponse.json(
          {
            success: false,
            message: `Product "${item.name}" not found in inventory`,
          },
          { status: 404 },
        );
      }

      if (inventoryItem.currentQty < item.selectedQuantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Only ${inventoryItem.currentQty} units available for "${item.name}"`,
          },
          { status: 400 },
        );
      }

      // Find the associated product
      const product = await getProductByInventoryId(item._id);

      if (product) {
        // Update product quantity
        if (product.quantity < item.selectedQuantity) {
          return NextResponse.json(
            {
              success: false,
              message: `Only ${product.quantity} units available in product stock for "${item.name}"`,
            },
            { status: 400 },
          );
        }

        product.quantity -= item.selectedQuantity;
        await product.save();

        updatedProducts.push({
          id: product._id,
          name: product.name,
          oldQuantity: product.quantity + item.selectedQuantity,
          newQuantity: product.quantity,
          deducted: item.selectedQuantity,
        });
      }

      // Update inventory quantity
      inventoryItem.currentQty -= item.selectedQuantity;
      await inventoryItem.save();

      updatedInventory.push({
        id: inventoryItem._id,
        name: inventoryItem.productName,
        barcode: inventoryItem.barcode,
        oldQuantity: inventoryItem.currentQty + item.selectedQuantity,
        newQuantity: inventoryItem.currentQty,
        deducted: item.selectedQuantity,
      });

      // Calculate proportional values for this item
      const itemDeliveryCharge = avgDeliveryCharge * item.selectedQuantity;
      const itemDiscount = avgDiscount * item.selectedQuantity;

      // Create Sale record for each unit sold
      for (let i = 0; i < item.selectedQuantity; i++) {
        const perUnitDeliveryCharge =
          itemDeliveryCharge / item.selectedQuantity;
        const perUnitDiscount = itemDiscount / item.selectedQuantity;
        const profit =
          item.sellingPrice -
          perUnitDiscount -
          inventoryItem.CPP -
          inventoryItem.purchaseRate;

        const saleRecord = await Sale.create({
          orderId: null, // Will update after order creation
          inventoryId: inventoryItem._id,
          productName: item.name,
          purchasePrice: inventoryItem.purchaseRate,
          CPP: inventoryItem.CPP,
          totalDiscount: perUnitDiscount,
          totalProductsInOrder: 1,
          deliveryCharge: perUnitDeliveryCharge,
          sellPrice: item.sellingPrice,
          profit: profit,
          date: new Date(),
          remarks: `Custom order - sold by admin${notes ? ` (${notes})` : ""}`,
        });

        saleRecords.push(saleRecord._id);
      }
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

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
        phone: customer.phone || "",
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

    // Update sale records with the order ID
    if (saleRecords.length > 0) {
      await Sale.updateMany(
        { _id: { $in: saleRecords } },
        { orderId: order._id },
      );
    }

    console.log("Custom order created successfully:", {
      orderId: order._id,
      orderNumber: order.lastNumber,
      admin: user.email || user.phone,
      inventoryUpdates: updatedInventory.length,
      productUpdates: updatedProducts.length,
      saleRecords: saleRecords.length,
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
            inventory: updatedInventory,
            products: updatedProducts,
          },
          saleRecordsCount: saleRecords.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating custom order:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create custom order",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
