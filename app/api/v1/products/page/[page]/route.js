// app/api/v1/products/page/[page]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Product from '@/app/models/Product';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    // Await the params promise
    const { page: pageParam } = await params;
    const perPage = 8;
    const page = parseInt(pageParam) || 1;
    const skip = (page - 1) * perPage;
    
    // Get products with pagination (no reviews population)
    const products = await Product.find({})
      .skip(skip)
      .limit(perPage)
      .select('-reviews -description')
      .sort({ createdAt: -1 });
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments({});
    
    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / perPage),
        totalProducts,
        perPage,
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      success: false,
      message: "An error occurred while fetching products",
      error: error.message,
    }, { status: 400 });
  }
}