// proxy.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'MAGMAIS89LAVA';

// Simple verify function without external deps
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Define protected routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isApiRoute = pathname.startsWith('/api');
  
  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // Verify token
  let user = null;
  if (token) {
    user = verifyToken(token);
  }
  
  // Handle admin routes protection
  if (isAdminRoute && !isApiRoute) {
    if (!token || !user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user is admin (role = 1)
    if (user.role !== 1) {
      // Redirect to home if not admin
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Handle API route protection
  if (isApiRoute && pathname.startsWith('/api/v1/admin')) {
    if (!token || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (user.role !== 1) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}