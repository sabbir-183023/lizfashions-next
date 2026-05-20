// app/api/v1/admin/coupons/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Coupon from '@/app/models/Coupon';
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
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid coupon ID' }, { status: 400 });
    }
    
    const { validityStart, validityEnd, couponCode, couponQty, discountAmount, dedicatedUserPhone, isAvtive, remarks } = body;
    
    // Check if coupon code exists for other coupons
    if (couponCode) {
      const existingCoupon = await Coupon.findOne({ couponCode, _id: { $ne: id } });
      if (existingCoupon) {
        return NextResponse.json({ 
          success: false, 
          message: "Coupon code already exists" 
        }, { status: 400 });
      }
    }
    
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      {
        validityStart: new Date(validityStart),
        validityEnd: new Date(validityEnd),
        couponCode: couponCode?.toUpperCase(),
        couponQty: parseInt(couponQty),
        discountAmount: parseFloat(discountAmount),
        dedicatedUserPhone: dedicatedUserPhone || null,
        isAvtive: isAvtive !== undefined ? isAvtive : true,
        remarks: remarks || ""
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCoupon) {
      return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updatedCoupon
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update coupon",
      error: error.message
    }, { status: 500 });
  }
}

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
      return NextResponse.json({ success: false, message: 'Invalid coupon ID' }, { status: 400 });
    }
    
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    
    if (!deletedCoupon) {
      return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message
    }, { status: 500 });
  }
}