// app/api/v1/admin/sales/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Sale from '@/app/models/Sale';
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const sales = await Sale.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    
    const total = await Sale.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      sales,
      total
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch sales",
      error: error.message
    }, { status: 500 });
  }
}