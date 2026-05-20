// app/api/v1/inventory/available/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Inventory from '@/app/models/Inventory';
import Category from '@/app/models/Category';
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
    
    // Get inventory items that are not linked to any product
    const inventory = await Inventory.find({ 
      linkedProduct: { $exists: false, $eq: null }
    }).populate('category', 'name').lean();
    
    return NextResponse.json({
      success: true,
      inventory,
      totalItems: inventory.length
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching available inventory:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message
    }, { status: 500 });
  }
}