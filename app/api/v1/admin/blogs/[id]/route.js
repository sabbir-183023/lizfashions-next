// app/api/v1/admin/blogs/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Blog from '@/app/models/Blog';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import slugify from 'slugify';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dh953tr0l",
  api_key: process.env.API_KEY || "939497349613645",
  api_secret: process.env.API_SECRET || "4lYPhpHkyhySBhiulrsmLzf7Ylg",
});

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

const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

const generateSlug = async (title, existingId) => {
  let slug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  let uniqueSlug = slug;
  let counter = 1;
  
  while (true) {
    const query = { slug: uniqueSlug, _id: { $ne: existingId } };
    const existingBlog = await Blog.findOne(query);
    if (!existingBlog) break;
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};

export async function GET(request, { params }) {
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
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid blog ID' }, { status: 400 });
    }
    
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      blog
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

export async function PUT(request, { params }) {
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
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid blog ID' }, { status: 400 });
    }
    
    const existingBlog = await Blog.findById(id);
    
    if (!existingBlog) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }
    
    const formData = await request.formData();
    const title = formData.get('title');
    const content = formData.get('content');
    const excerpt = formData.get('excerpt');
    const category = formData.get('category');
    const tags = formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [];
    const status = formData.get('status');
    const photoFile = formData.get('photo');
    
    if (!title || !content) {
      return NextResponse.json({ 
        success: false, 
        message: "Title and content are required" 
      }, { status: 400 });
    }
    
    // Generate new slug if title changed
    let slug = existingBlog.slug;
    if (title !== existingBlog.title) {
      slug = await generateSlug(title, id);
    }
    
    let photoData = existingBlog.photo;
    
    // If new photo is uploaded, delete old one and upload new
    if (photoFile && photoFile.size > 0) {
      // Delete old photo from Cloudinary
      if (existingBlog.photo?.public_id) {
        await deleteFromCloudinary(existingBlog.photo.public_id);
      }
      
      const uploadResult = await uploadToCloudinary(photoFile, "BlogPhotos");
      photoData = {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 160),
        photo: photoData,
        category: category || "Uncategorized",
        tags,
        status: status || "published",
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update blog",
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid blog ID' }, { status: 400 });
    }
    
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return NextResponse.json({ success: false, message: 'Blog not found' }, { status: 404 });
    }
    
    // Delete photo from Cloudinary
    if (blog.photo?.public_id) {
      await deleteFromCloudinary(blog.photo.public_id);
    }
    
    // Delete blog from database
    await Blog.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete blog",
      error: error.message
    }, { status: 500 });
  }
}