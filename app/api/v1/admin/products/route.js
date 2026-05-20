// app/api/v1/admin/products/route.js - Using aggregation
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
    
    // Calculate skip
    const skip = (page - 1) * limit;
    
    // Build match stage
    let matchStage = {};
    
    // Handle category filter
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      matchStage.category = new mongoose.Types.ObjectId(categoryId);
    } else if (categoryId) {
      return NextResponse.json({
        success: true,
        products: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        }
      }, { status: 200 });
    }
    
    // Build search stage
    let searchStage = {};
    if (search) {
      const searchStr = String(search);
      const searchRegex = new RegExp(searchStr, 'i');
      
      // Using $or with $regex for string fields and $toString for SKU
      searchStage = {
        $or: [
          { name: searchRegex },
          { slug: searchRegex },
          { description: searchRegex },
          { SKU: searchRegex },
          // For numeric SKU stored as number
          { $expr: { $regexMatch: { input: { $toString: "$SKU" }, regex: searchStr, options: 'i' } } }
        ]
      };
    }
    
    // Combine match and search
    const finalMatchStage = { ...matchStage };
    if (searchStage.$or) {
      finalMatchStage.$and = [searchStage];
    }
    
    // Build aggregation pipeline
    const pipeline = [
      { $match: finalMatchStage },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          categoryName: { $ifNull: [{ $arrayElemAt: ['$categoryInfo.name', 0] }, 'Uncategorized'] },
          categoryId: { $arrayElemAt: ['$categoryInfo._id', 0] }
        }
      },
      {
        $project: {
          categoryInfo: 0
        }
      },
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
      { $skip: skip },
      { $limit: limit }
    ];
    
    // Count pipeline
    const countPipeline = [
      { $match: finalMatchStage },
      { $count: 'total' }
    ];
    
    const [products, countResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline)
    ]);
    
    const totalCount = countResult[0]?.total || 0;
    
    return NextResponse.json({
      success: true,
      products,
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