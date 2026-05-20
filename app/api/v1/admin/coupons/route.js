// app/api/v1/admin/coupons/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Coupon from '@/app/models/Coupon';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';

export async function GET(request) {
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
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = {};
    if (status === 'active') {
      query.isAvtive = true;
      query.validityEnd = { $gte: new Date() };
    } else if (status === 'expired') {
      query.validityEnd = { $lt: new Date() };
    }
    
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    const total = await Coupon.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      coupons,
      total
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message
    }, { status: 500 });
  }
}

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
    const { validityStart, validityEnd, couponCode, couponQty, discountAmount, dedicatedUserPhone, remarks } = body;
    
    if (!validityStart || !validityEnd || !couponCode || !couponQty || !discountAmount) {
      return NextResponse.json({ 
        success: false, 
        message: "Start date, end date, coupon code, quantity, and discount amount are required" 
      }, { status: 400 });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ couponCode });
    if (existingCoupon) {
      return NextResponse.json({ 
        success: false, 
        message: "Coupon code already exists" 
      }, { status: 400 });
    }
    
    const coupon = await Coupon.create({
      validityStart: new Date(validityStart),
      validityEnd: new Date(validityEnd),
      couponCode: couponCode.toUpperCase(),
      couponQty: parseInt(couponQty),
      discountAmount: parseFloat(discountAmount),
      dedicatedUserPhone: dedicatedUserPhone || null,
      isAvtive: true,
      remarks: remarks || ""
    });
    
    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      coupon
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create coupon",
      error: error.message
    }, { status: 500 });
  }
}