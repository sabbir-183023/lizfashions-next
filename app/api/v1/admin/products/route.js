// app/api/v1/admin/products/route.js - Fixed version
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Product from '@/app/models/Product';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    // Verify admin access
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { SKU: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle category filter - check if it's a valid ObjectId
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.category = new mongoose.Types.ObjectId(categoryId);
    } else if (categoryId) {
      // If invalid ObjectId, return empty results
      return NextResponse.json({
        success: true,
        products: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false
        }
      }, { status: 200 });
    }
    
    // Calculate skip
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute queries in parallel with population for category name
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .select('name slug SKU sellingPrice quantity photos category createdAt')
        .populate('category', 'name') // Populate category name
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);
    
    // Transform products to include category name
    const transformedProducts = products.map(product => ({
      ...product,
      category: product.category?.name || 'Uncategorized',
      categoryId: product.category?._id || null
    }));
    
    return NextResponse.json({
      success: true,
      products: transformedProducts,
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
    console.error('Error fetching admin products:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    }, { status: 500 });
  }
}