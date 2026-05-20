// app/api/v1/admin/blogs/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Blog from '@/app/models/Blog';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import { v2 as cloudinary } from 'cloudinary';
import slugify from 'slugify';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dh953tr0l",
  api_key: process.env.API_KEY || "939497349613645",
  api_secret: process.env.API_SECRET || "4lYPhpHkyhySBhiulrsmLzf7Ylg",
});

// Helper to upload file to Cloudinary
const uploadToCloudinary = async (file, folder = "BlogPhotos") => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};

// Helper to delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

// Generate unique slug
const generateSlug = async (title, existingId = null) => {
  let slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    const query = { slug: uniqueSlug };
    if (existingId) query._id = { $ne: existingId };
    const existingBlog = await Blog.findOne(query);
    if (!existingBlog) break;
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

export async function GET(request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    const total = await Blog.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      blogs,
      total
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

export async function POST(request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    
    await connectToDatabase();
    
    const formData = await request.formData();
    const title = formData.get('title');
    const content = formData.get('content');
    const excerpt = formData.get('excerpt');
    const category = formData.get('category');
    const tags = formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [];
    const status = formData.get('status');
    const photoFile = formData.get('photo');
    
    if (!title || !content || !photoFile) {
      return NextResponse.json({ 
        success: false, 
        message: "Title, content, and photo are required" 
      }, { status: 400 });
    }
    
    // Generate unique slug
    const slug = await generateSlug(title);
    
    // Upload photo to Cloudinary
    const uploadResult = await uploadToCloudinary(photoFile, "BlogPhotos");
    
    const blog = await Blog.create({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 160),
      photo: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
      category: category || "Uncategorized",
      tags,
      status: status || "published",
      views: 0
    });
    
    return NextResponse.json({
      success: true,
      message: "Blog created successfully",
      blog
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create blog",
      error: error.message
    }, { status: 500 });
  }
}