// app/api/v1/categories/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Category from '@/app/models/Category';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const categories = await Category.find({})
      .select('name slug _id')
      .sort({ name: 1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      categories,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      success: false,
      message: "An error occurred while fetching categories",
      error: error.message,
    }, { status: 500 });
  }
}