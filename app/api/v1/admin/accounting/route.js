// app/api/v1/admin/accounting/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Accounts from '@/app/models/Accounts';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';

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
    
    const accounts = await Accounts.find({}).sort({ accountingEquation: 1, name: 1 });
    
    return NextResponse.json({
      success: true,
      accounts
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch accounts",
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
    
    const body = await request.json();
    const { name, accountingEquation, defaultAcc } = body;
    
    if (!name || !accountingEquation || !defaultAcc) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }
    
    const existingAccount = await Accounts.findOne({ name });
    if (existingAccount) {
      return NextResponse.json({ success: false, message: "Account name already exists" }, { status: 400 });
    }
    
    const account = await Accounts.create({ name, accountingEquation, defaultAcc });
    
    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      account
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create account",
      error: error.message
    }, { status: 500 });
  }
}