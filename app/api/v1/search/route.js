// app/api/v1/search/route.js (updated)
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Product from '@/app/models/Product';
import Category from '@/app/models/Category';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const sort = searchParams.get('sort') || 'relevance';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    const skip = (page - 1) * limit;
    
    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: true,
        products: [],
        suggestions: [],
        total: 0,
        message: "Search query is too short"
      }, { status: 200 });
    }
    
    const searchRegex = new RegExp(query, 'i');
    
    // Find matching categories
    const matchingCategories = await Category.find({
      name: searchRegex
    }).select('name _id').lean();
    
    const categoryIds = matchingCategories.map(cat => cat._id);
    
    // Build search query
    const searchQuery = {
      $or: [
        { name: searchRegex },
        { SKU: searchRegex },
        { description: searchRegex },
        { colors: { $in: [searchRegex] } },
        ...(categoryIds.length > 0 ? [{ category: { $in: categoryIds } }] : [])
      ]
    };
    
    // Add price filter
    if (minPrice || maxPrice) {
      searchQuery.sellingPrice = {};
      if (minPrice) searchQuery.sellingPrice.$gte = parseInt(minPrice);
      if (maxPrice) searchQuery.sellingPrice.$lte = parseInt(maxPrice);
    }
    
    // Build sort options
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
        sortOptions = { createdAt: -1 };
        break;
      case 'relevance':
      default:
        sortOptions = { name: 1 };
        break;
    }
    
    // Get total count
    const total = await Product.countDocuments(searchQuery);
    
    // Get products with pagination
    const products = await Product.find(searchQuery)
      .select('name slug SKU sellingPrice originalPrice category quantity photos colors createdAt description')
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Transform products
    const transformedProducts = products.map(product => ({
      ...product,
      _id: product._id.toString(),
      priceDisplay: `৳${product.sellingPrice.toLocaleString()}`,
      categoryName: product.category?.name || 'Uncategorized',
      thumbnail: product.photos?.[0]?.url || null
    }));
    
    return NextResponse.json({
      success: true,
      products: transformedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to search products",
      error: error.message,
      products: [],
      total: 0
    }, { status: 500 });
  }
}