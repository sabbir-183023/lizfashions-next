// app/api/v1/admin/orders/[id]/tracking/route.js
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
    const { courierTrackingId } = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order ID' }, { status: 400 });
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      { courierTrackingId },
      { new: true }
    );
    
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Tracking ID updated successfully",
      order
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating tracking ID:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update tracking ID",
      error: error.message
    }, { status: 500 });
  }
}