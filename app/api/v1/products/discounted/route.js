// app/api/v1/products/discounted/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Product from '@/app/models/Product';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Find products where originalPrice exists and is not null or 0
    const products = await Product.find({ 
      originalPrice: { $ne: null, $gt: 0 } // originalPrice exists and greater than 0
    })
    .sort({ createdAt: -1 }) // Sort by newest first
    .limit(8); // Limit to 8 products for performance
    
    // Get total count of discounted products
    const totalDiscounted = await Product.countDocuments({ 
      originalPrice: { $ne: null, $gt: 0 }
    });
    
    return NextResponse.json({
      success: true,
      count: products.length,
      totalDiscounted,
      products,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching discounted products:', error);
    return NextResponse.json({
      success: false,
      message: "Server Error",
      error: error.message,
    }, { status: 500 });
  }
}