// app/api/v1/coupons/validate/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Coupon from '@/app/models/Coupon';

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const { code, phone, total } = body;
    
    if (!code) {
      return NextResponse.json({
        success: false,
        message: "Coupon code is required"
      }, { status: 400 });
    }
    
    // Find coupon
    const coupon = await Coupon.findOne({ couponCode: code.toUpperCase() });
    
    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: "Invalid coupon code"
      }, { status: 400 });
    }
    
    // Check if active
    if (!coupon.isAvtive) {
      return NextResponse.json({
        success: false,
        message: "This coupon is no longer active"
      }, { status: 400 });
    }
    
    // Check quantity
    if (coupon.couponQty <= 0) {
      return NextResponse.json({
        success: false,
        message: "This coupon has expired (no remaining uses)"
      }, { status: 400 });
    }
    
    // Check validity dates
    const now = new Date();
    const startDate = new Date(coupon.validityStart);
    const endDate = new Date(coupon.validityEnd);
    
    if (now < startDate) {
      return NextResponse.json({
        success: false,
        message: `This coupon is valid from ${startDate.toLocaleDateString()}`
      }, { status: 400 });
    }
    
    if (now > endDate) {
      return NextResponse.json({
        success: false,
        message: "This coupon has expired"
      }, { status: 400 });
    }
    
    // Check if dedicated to specific user - FIXED LOGIC
    if (coupon.dedicatedUserPhone && coupon.dedicatedUserPhone.trim() !== "") {
      // If coupon is dedicated to a specific user, phone number is REQUIRED
      if (!phone || phone.trim() === "") {
        return NextResponse.json({
          success: false,
          message: "Phone number is required to use this coupon"
        }, { status: 400 });
      }
      
      if (coupon.dedicatedUserPhone !== phone) {
        return NextResponse.json({
          success: false,
          message: "This coupon is only valid for a specific user"
        }, { status: 400 });
      }
    }
    
    // Calculate discount (can be percentage or fixed - here it's fixed amount)
    let discountAmount = coupon.discountAmount;
    
    // If discount is percentage (if you want to support percentage)
    // discountAmount = (total * coupon.discountAmount) / 100;
    
    // Ensure discount doesn't exceed total
    if (discountAmount > total) {
      discountAmount = total;
    }
    
    return NextResponse.json({
      success: true,
      message: `Coupon applied! You saved ৳${discountAmount}`,
      discount: discountAmount,
      coupon: {
        code: coupon.couponCode,
        discountAmount: coupon.discountAmount,
        remainingUses: coupon.couponQty - 1
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to validate coupon",
      error: error.message
    }, { status: 500 });
  }
}