// app/api/v1/auth/me/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'MAGMAIS89LAVA';

// Helper function to get token from request cookies (works in API routes)
function getTokenFromRequest(request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  return cookies.auth_token || null;
}

export async function GET(request) {
  try {
    // Get token from cookies
    const token = getTokenFromRequest(request);
    
    if (!token) {
      console.log('No token found in cookies');
      return NextResponse.json({
        success: false,
        message: 'Not authenticated'
      }, { status: 401 });
    }
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verified for user:', decoded.email);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
      }, { status: 401 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get user from database
    const user = await User.findById(decoded.userId)
      .select('-password');
    
    if (!user) {
      console.log('User not found:', decoded.userId);
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    console.log('User found:', user.email);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        district: user.district,
        country: user.country,
        role: user.role,
        wishList: user.wishList || [],
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get user error details:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    }, { status: 500 });
  }
}