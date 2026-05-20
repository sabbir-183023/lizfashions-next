// app/api/v1/blogs/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Blog from '@/app/models/Blog';

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '6');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build query - NO status filter, get ALL blogs (draft + published)
    let query = {};
    
    // Add search filter if search term exists
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .select('title slug excerpt photo tags views createdAt status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(query)
    ]);
    
    return NextResponse.json({
      success: true,
      blogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message
    }, { status: 500 });
  }
}