// app/api/v1/blogs/[slug]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Blog from '@/app/models/Blog';

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { slug } = await params;
    
    // Find blog - NO status filter, get ANY blog (draft or published)
    const blog = await Blog.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
    
    if (!blog) {
      return NextResponse.json({
        success: false,
        message: "Blog not found"
      }, { status: 404 });
    }
    
    // Get recent 3 blogs (excluding current)
    const recentBlogs = await Blog.find({
      _id: { $ne: blog._id },
    })
      .select('title slug photo createdAt status')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    
    return NextResponse.json({
      success: true,
      blog,
      recentBlogs,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message
    }, { status: 500 });
  }
}