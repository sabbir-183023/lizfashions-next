// app/api/v1/auth/login/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'MAGMAIS89LAVA';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    console.log('Login attempt for email:', email);
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    console.log('Database connected');
    
    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', !!user);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email or password'
      }, { status: 401 });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        district: user.district,
        country: user.country,
        role: user.role,
        wishList: user.wishList || []
      }
    });
    
    // Set cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    console.log('Login successful for:', email);
    return response;
    
  } catch (error) {
    console.error('Login error details:', error);
    return NextResponse.json({
      success: false,
      message: 'Login failed',
      error: error.message
    }, { status: 500 });
  }
}