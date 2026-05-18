// app/api/v1/admin/inventory/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Inventory from '@/app/models/Inventory';
import Category from '@/app/models/Category';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

// Helper to calculate CFP and Profit
const calculateInventoryMetrics = (data) => {
  const CFP = (data.purchaseRate || 0) + (data.CPP || 0);
  const profitPerProduct = (data.saleRate || 0) - CFP;
  return { CFP, profitPerProduct };
};

// Generate unique 7-digit barcode
const generateUniqueBarcode = async () => {
  let barcode;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    // Generate random 7-digit number (1000000 to 9999999)
    barcode = Math.floor(1000000 + Math.random() * 9000000).toString();
    
    // Check if barcode already exists
    const existingItem = await Inventory.findOne({ barcode });
    exists = !!existingItem;
    attempts++;
  }

  if (exists) {
    throw new Error('Failed to generate unique barcode after multiple attempts');
  }

  return barcode;
};

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
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || '';
    const stockStatus = searchParams.get('stockStatus') || '';
    
    let query = {};
    
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.category = new mongoose.Types.ObjectId(categoryId);
    }
    
    if (stockStatus === 'out') {
      query.currentQty = 0;
    } else if (stockStatus === 'low') {
      query.currentQty = { $gt: 0, $lte: 10 };
    } else if (stockStatus === 'in') {
      query.currentQty = { $gt: 0 };
    }
    
    const inventory = await Inventory.find(query)
      .populate('category', 'name')
      .sort({ date: -1 })
      .lean();
    
    const transformedInventory = inventory.map(item => ({
      ...item,
      categoryName: item.category?.name || 'Uncategorized',
      categoryId: item.category?._id || null
    }));
    
    return NextResponse.json({
      success: true,
      inventory: transformedInventory,
      totalItems: transformedInventory.length
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
    
    // Validate required fields
    const requiredFields = ['date', 'productName', 'category', 'initialQty', 'currentQty', 'purchaseRate', 'CPP', 'saleRate'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ success: false, message: `${field} is required` }, { status: 400 });
      }
    }
    
    // Generate unique barcode for new product (only if not provided)
    let barcode = body.barcode;
    if (!barcode || barcode === '') {
      barcode = await generateUniqueBarcode();
    } else {
      // If barcode is provided, check if it's unique
      const existingItem = await Inventory.findOne({ barcode });
      if (existingItem) {
        return NextResponse.json({ success: false, message: 'Barcode already exists' }, { status: 400 });
      }
    }
    
    // Calculate CFP and profitPerProduct
    const { CFP, profitPerProduct } = calculateInventoryMetrics(body);
    
    const inventory = await Inventory.create({
      ...body,
      barcode,
      CFP,
      profitPerProduct,
      date: new Date(body.date),
      category: new mongoose.Types.ObjectId(body.category)
    });
    
    const populatedInventory = await Inventory.findById(inventory._id).populate('category', 'name');
    
    return NextResponse.json({
      success: true,
      message: "Inventory added successfully",
      inventory: populatedInventory
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to create inventory",
      error: error.message
    }, { status: 500 });
  }
}