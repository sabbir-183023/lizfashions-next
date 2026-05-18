// app/api/v1/admin/custom-order/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase, withPrimaryWrite } from '@/app/lib/mongodb';
import Order from '@/app/models/Order';
import Inventory from '@/app/models/Inventory';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

// Helper function to generate order number with retry
const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const startOfDay = new Date(year, month - 1, day);
  const endOfDay = new Date(year, month - 1, day + 1);
  
  const todayOrdersCount = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay }
  });
  
  const sequence = String(todayOrdersCount + 1).padStart(4, '0');
  return `ORD-${year}${month}${day}-${sequence}`;
};

export async function POST(request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    const body = await request.json();
    const { items, customer, subtotal, deliveryCharge, discount, total, notes } = body;
    
    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: "No products selected" }, { status: 400 });
    }
    
    if (!customer || !customer.name || !customer.phone) {
      return NextResponse.json({ success: false, message: "Customer name and phone are required" }, { status: 400 });
    }
    
    // Update inventory quantities
    for (const item of items) {
      const inventoryItem = await Inventory.findById(item._id);
      if (!inventoryItem) {
        return NextResponse.json({ 
          success: false, 
          message: `Product "${item.name}" not found in inventory` 
        }, { status: 404 });
      }
      
      if (inventoryItem.currentQty < item.selectedQuantity) {
        return NextResponse.json({ 
          success: false, 
          message: `Only ${inventoryItem.currentQty} units available for "${item.name}"` 
        }, { status: 400 });
      }
      
      // Update current quantity
      inventoryItem.currentQty -= item.selectedQuantity;
      await inventoryItem.save();
    }
    
    // Generate order number
    const orderNumber = await generateOrderNumber();
    
    // Prepare order data
    const orderData = {
      products: items.map(item => ({
        productId: item._id,
        name: item.name,
        SKU: item.SKU,
        sellingPrice: item.sellingPrice,
        originalPrice: item.originalPrice || item.sellingPrice,
        amount: item.selectedQuantity,
        photos: item.photos || [],
        slug: item.slug,
        maxQuantity: item.maxQuantity
      })),
      payment: {
        method: "Cash on Delivery",
        status: "Pending",
        amount: total
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
      notes: notes || ""
    };
    
    const order = await withPrimaryWrite(async () => {
      return await Order.create(orderData);
    });
    
    return NextResponse.json({
      success: true,
      message: "Custom order created successfully",
      data: {
        orderId: order._id,
        orderNumber: order.lastNumber,
        total: order.subTotal + parseInt(order.deliveryCharge) - (parseInt(order.couponDiscount) || 0),
        status: order.status,
        orderDate: order.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating custom order:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create custom order",
      error: error.message
    }, { status: 500 });
  }
}