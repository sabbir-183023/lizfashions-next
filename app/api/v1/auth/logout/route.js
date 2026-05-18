// app/api/v1/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });
    
    // Clear the auth cookie
    response.cookies.delete('auth_token');
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      message: 'Logout failed',
      error: error.message
    }, { status: 500 });
  }
}