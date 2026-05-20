// app/api/v1/admin/slides/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import HomePageSlide from '@/app/models/Slide';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dh953tr0l",
  api_key: process.env.API_KEY || "939497349613645",
  api_secret: process.env.API_SECRET || "4lYPhpHkyhySBhiulrsmLzf7Ylg",
});

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

const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
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
      return NextResponse.json({ success: false, message: 'Invalid slide ID' }, { status: 400 });
    }
    
    const slide = await HomePageSlide.findById(id);
    
    if (!slide) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      slide
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching slide:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch slide",
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
      return NextResponse.json({ success: false, message: 'Invalid slide ID' }, { status: 400 });
    }
    
    const existingSlide = await HomePageSlide.findById(id);
    
    if (!existingSlide) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }
    
    const formData = await request.formData();
    const title = formData.get('title');
    const subtitle = formData.get('subtitle');
    const description = formData.get('description');
    const order = parseInt(formData.get('order')) || 0;
    const isActive = formData.get('isActive') === 'true';
    const imageFile = formData.get('image');
    
    let imageUrl = existingSlide.image;
    
    // If new image is uploaded, delete old one and upload new
    if (imageFile && imageFile.size > 0) {
      // Extract public_id from old image URL
      const oldPublicId = existingSlide.image.split('/').slice(-2).join('/').split('.')[0];
      await deleteFromCloudinary(oldPublicId);
      
      const uploadResult = await uploadToCloudinary(imageFile, "HomePageSlide");
      imageUrl = uploadResult.secure_url;
    }
    
    const updatedSlide = await HomePageSlide.findByIdAndUpdate(
      id,
      {
        title,
        subtitle,
        description,
        image: imageUrl,
        order,
        isActive
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      message: "Slide updated successfully",
      slide: updatedSlide
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating slide:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update slide",
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
      return NextResponse.json({ success: false, message: 'Invalid slide ID' }, { status: 400 });
    }
    
    const slide = await HomePageSlide.findById(id);
    
    if (!slide) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }
    
    // Delete image from Cloudinary
    const publicId = slide.image.split('/').slice(-2).join('/').split('.')[0];
    await deleteFromCloudinary(publicId);
    
    // Delete slide from database
    await HomePageSlide.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: "Slide deleted successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting slide:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete slide",
      error: error.message
    }, { status: 500 });
  }
}