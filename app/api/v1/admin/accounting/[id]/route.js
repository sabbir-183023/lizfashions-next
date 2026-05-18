// app/api/v1/admin/accounting/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Accounts from '@/app/models/Accounts';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

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
      return NextResponse.json({ success: false, message: 'Invalid account ID' }, { status: 400 });
    }
    
    const account = await Accounts.findById(id);
    
    if (!account) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      account
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch account",
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
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid account ID' }, { status: 400 });
    }
    
    const updatedAccount = await Accounts.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );
    
    if (!updatedAccount) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Account updated successfully",
      account: updatedAccount
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update account",
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
      return NextResponse.json({ success: false, message: 'Invalid account ID' }, { status: 400 });
    }
    
    const deletedAccount = await Accounts.findByIdAndDelete(id);
    
    if (!deletedAccount) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete account",
      error: error.message
    }, { status: 500 });
  }
}