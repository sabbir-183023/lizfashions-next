// app/api/v1/admin/slides/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import HomePageSlide from '@/app/models/Slide';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dh953tr0l",
  api_key: process.env.API_KEY || "939497349613645",
  api_secret: process.env.API_SECRET || "4lYPhpHkyhySBhiulrsmLzf7Ylg",
});

// Helper to upload file to Cloudinary
const uploadToCloudinary = async (file, folder = "HomePageSlide") => {
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
    
    const slides = await HomePageSlide.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      slides,
      total: slides.length
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching slides:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch slides",
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
    const subtitle = formData.get('subtitle');
    const description = formData.get('description');
    const order = parseInt(formData.get('order')) || 0;
    const isActive = formData.get('isActive') === 'true';
    const imageFile = formData.get('image');
    
    if (!title || !subtitle || !description || !imageFile) {
      return NextResponse.json({ 
        success: false, 
        message: "Title, subtitle, description, and image are required" 
      }, { status: 400 });
    }
    
    // Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(imageFile, "HomePageSlide");
    
    const slide = await HomePageSlide.create({
      title,
      subtitle,
      description,
      image: uploadResult.secure_url,
      order,
      isActive
    });
    
    return NextResponse.json({
      success: true,
      message: "Slide created successfully",
      slide
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating slide:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create slide",
      error: error.message
    }, { status: 500 });
  }
}