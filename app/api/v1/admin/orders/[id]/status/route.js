// app/api/v1/admin/orders/[id]/status/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Order from '@/app/models/Order';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

export async function PUT(request, { params }) {
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
    const { status } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }
    
    const validStatuses = ["Pending Confirmation", "Processing", "Ready to Ship", "In Transit", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update order status",
      error: error.message
    }, { status: 500 });
  }
}