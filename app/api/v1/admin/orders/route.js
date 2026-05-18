// app/api/v1/admin/orders/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Order from '@/app/models/Order';
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    
    let query = {};
    
    if (search) {
      query.$or = [
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'buyer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { 'buyer.phone': { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [orders, totalCount] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query)
    ]);
    
    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message
    }, { status: 500 });
  }
}