// app/api/v1/admin/inventory/[id]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Inventory from '@/app/models/Inventory';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

const calculateInventoryMetrics = (data) => {
  const CFP = (data.purchaseRate || 0) + (data.CPP || 0);
  const profitPerProduct = (data.saleRate || 0) - CFP;
  return { CFP, profitPerProduct };
};

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
      return NextResponse.json({ success: false, message: 'Invalid inventory ID' }, { status: 400 });
    }
    
    const inventory = await Inventory.findById(id).populate('category', 'name');
    
    if (!inventory) {
      return NextResponse.json({ success: false, message: 'Inventory not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      inventory
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch inventory",
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
      return NextResponse.json({ success: false, message: 'Invalid inventory ID' }, { status: 400 });
    }
    
    // Calculate CFP and profitPerProduct
    const { CFP, profitPerProduct } = calculateInventoryMetrics(body);
    
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      {
        ...body,
        CFP,
        profitPerProduct,
        date: body.date ? new Date(body.date) : undefined,
        category: body.category ? new mongoose.Types.ObjectId(body.category) : undefined
      },
      { new: true, runValidators: true }
    ).populate('category', 'name');
    
    if (!updatedInventory) {
      return NextResponse.json({ success: false, message: 'Inventory not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Inventory updated successfully",
      inventory: updatedInventory
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update inventory",
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
      return NextResponse.json({ success: false, message: 'Invalid inventory ID' }, { status: 400 });
    }
    
    const deletedInventory = await Inventory.findByIdAndDelete(id);
    
    if (!deletedInventory) {
      return NextResponse.json({ success: false, message: 'Inventory not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Inventory deleted successfully"
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete inventory",
      error: error.message
    }, { status: 500 });
  }
}