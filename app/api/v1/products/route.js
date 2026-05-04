// app/api/v1/products/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Product from '@/app/models/Product';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const category = searchParams.get('category');
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = parseInt(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = parseInt(maxPrice);
    }
    
    // Build sort object
    let sortOptions = {};
    switch (sort) {
      case 'price_asc':
        sortOptions = { sellingPrice: 1 };
        break;
      case 'price_desc':
        sortOptions = { sellingPrice: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }
    
    // Get products with pagination
    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .select('name slug sellingPrice originalPrice category quantity SKU photos colors createdAt')
      .sort(sortOptions)
      .lean();
    
    // Get total count for pagination info
    const totalProducts = await Product.countDocuments(filter);
    
    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        perPage: limit,
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      success: false,
      message: "An error occurred while fetching products",
      error: error.message,
    }, { status: 500 });
  }
}