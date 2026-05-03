// app/api/v1/blogs/recent/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Blog from '@/app/models/Blog';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Remove status filter to get all blogs
    const blogs = await Blog.find({})  // ← Changed: removed status filter
      .sort({ createdAt: -1 })
      .limit(4);
    
    return NextResponse.json({
      success: true,
      blogs,
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error getting blogs:', error);
    
    // ✅ Fix: Safely handle error with type checking
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({
      success: false,
      message: "Error getting blogs!",
      error: errorMessage,
    }, { status: 500 });
  }
}