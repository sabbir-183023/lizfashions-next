// app/lib/authUtils.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'MAGMAIS89LAVA';
const JWT_EXPIRES_IN = '7d';

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Set cookie with token (Server-side)
export const setAuthCookie = async (token) => {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
};

// Get token from cookie (Server-side)
export const getAuthToken = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
};

// Remove auth cookie (Server-side)
export const removeAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
};

// Get current user from token (Server-side)
export const getCurrentUser = async () => {
  const token = await getAuthToken();
  if (!token) return null;
  return verifyToken(token);
};