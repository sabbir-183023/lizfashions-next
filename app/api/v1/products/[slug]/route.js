// app/api/v1/products/[slug]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Product from '@/app/models/Product';
import Category from '@/app/models/Category';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { slug } = await params;
    
    // Find product by slug and populate category only (no reviews)
    const product = await Product.findOne({ slug })
      .populate("category")
      .lean(); // Use lean() for better performance since we don't need Mongoose documents
    
    if (!product) {
      return NextResponse.json({
        success: false,
        message: "Product not found",
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Single Product Fetched",
      product,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching single product:', error);
    return NextResponse.json({
      success: false,
      message: "Error while getting single product",
      error: error.message,
    }, { status: 500 });
  }
}