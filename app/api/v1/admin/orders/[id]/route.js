// app/api/v1/admin/orders/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Order from '@/app/models/Order';
import Product from '@/app/models/Product';
import Inventory from '@/app/models/Inventory';
import Sale from '@/app/models/Sale';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

// GET - Fetch single order
export async function GET(request, { params }) {
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
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      order
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch order",
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete order and restore inventory
export async function DELETE(request, { params }) {
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
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    
    // Restore product and inventory quantities
    for (const product of order.products) {
      // Restore product quantity
      const productItem = await Product.findById(product.productId);
      if (productItem) {
        productItem.quantity += product.amount;
        await productItem.save();
      }
      
      // Find and restore inventory quantity
      let inventory = null;
      
      // Try by product inventory reference
      if (productItem?.inventory) {
        inventory = await Inventory.findById(productItem.inventory);
      }
      
      // Try by SKU
      if (!inventory && product.SKU) {
        inventory = await Inventory.findOne({ barcode: product.SKU });
      }
      
      if (inventory) {
        inventory.currentQty += product.amount;
        await inventory.save();
      }
    }
    
    // Delete associated sale records
    await Sale.deleteMany({ orderId: id });
    
    // Delete the order
    await Order.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Order deleted successfully and inventory restored"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete order",
      error: error.message
    }, { status: 500 });
  }
}