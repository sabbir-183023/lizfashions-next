// app/api/v1/auth/register/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { hashPassword, generateToken, setAuthCookie } from '@/app/lib/authUtils';

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const { name, email, password, phone, address, district } = await request.json();
    
    // Validate input
    if (!name || !email || !password || !phone) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, password, and phone are required'
      }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User already exists with this email'
      }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address: address || '',
      district: district || '',
      country: 'Bangladesh',
      role: 0
    });
    
    // Generate token
    const token = generateToken(user._id, user.email, user.role);
    
    // Set cookie
    await setAuthCookie(token);
    
    // Return user data
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      district: user.district,
      country: user.country,
      role: user.role,
      wishList: user.wishList
    };
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: userData,
      token
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Registration failed',
      error: error.message
    }, { status: 500 });
  }
}