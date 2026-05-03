// app/api/v1/slide/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import HomePageSlide from '@/app/models/Slide';

// GET /api/v1/slide - Get all slides
export async function GET() {
  try {
    await connectToDatabase();
    const slides = await HomePageSlide.find().sort({ createdAt: -1 });
    
    return NextResponse.json(slides, { status: 200 });
  } catch (error) {
    console.error('Error fetching slides:', error);
    
    // Safe error message handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Error fetching slides', 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/slide - Add new slide
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { title, subtitle, description, image } = body;

    // Validate required fields
    if (!image) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Image is required' 
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check content limit (max 3)
    const slideCount = await HomePageSlide.countDocuments();
    if (slideCount >= 3) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Slide limit reached (maximum 3 slides allowed)' 
        },
        { status: 400 }
      );
    }

    // Create and save new slide
    const newSlide = new HomePageSlide({ 
      title: title || '', 
      subtitle: subtitle || '', 
      description: description || '', 
      image 
    });
    
    const savedSlide = await newSlide.save();

    return NextResponse.json(
      { 
        success: true,
        data: savedSlide 
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding slide:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Error adding slide', 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

// Optional: DELETE /api/v1/slide/[id] - Delete a slide
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    
    const deletedSlide = await HomePageSlide.findByIdAndDelete(id);
    
    if (!deletedSlide) {
      return NextResponse.json(
        { success: false, message: 'Slide not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: 'Slide deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting slide:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting slide' },
      { status: 500 }
    );
  }
}