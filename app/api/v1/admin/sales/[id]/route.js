// app/api/v1/admin/sales/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Sale from '@/app/models/Sale';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

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
      return NextResponse.json({ success: false, message: 'Invalid sale ID' }, { status: 400 });
    }
    
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );
    
    if (!updatedSale) {
      return NextResponse.json({ success: false, message: 'Sale record not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Sale record updated successfully",
      sale: updatedSale
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating sale:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update sale",
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
      return NextResponse.json({ success: false, message: 'Invalid sale ID' }, { status: 400 });
    }
    
    const deletedSale = await Sale.findByIdAndDelete(id);
    
    if (!deletedSale) {
      return NextResponse.json({ success: false, message: 'Sale record not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Sale record deleted successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting sale:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete sale",
      error: error.message
    }, { status: 500 });
  }
}