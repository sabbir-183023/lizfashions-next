// app/api/v1/admin/inventory/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Inventory from '@/app/models/Inventory';
import Product from '@/app/models/Product';
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
    barcode = Math.floor(1000000 + Math.random() * 9000000).toString();
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
    const productStatus = searchParams.get('productStatus') || '';
    
    // Build query for inventory
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
    
    // Get all inventory items
    const inventory = await Inventory.find(query)
      .populate('category', 'name')
      .sort({ date: -1 })
      .lean();
    
    // Get all products with their SKU
    const products = await Product.find({}, 'SKU name slug').lean();
    
    // Create a Map for SKU lookup with STRING conversion
    const skuToProductMap = new Map();
    products.forEach(product => {
      if (product.SKU) {
        const skuString = String(product.SKU);
        skuToProductMap.set(skuString, {
          _id: product._id,
          name: product.name,
          slug: product.slug
        });
      }
    });
    
    // Add isLinkedToProduct flag by matching barcode with SKU
    const inventoryWithStatus = inventory.map(item => {
      let matchedProduct = null;
      
      if (item.barcode) {
        const barcodeString = String(item.barcode);
        matchedProduct = skuToProductMap.get(barcodeString);
      }
      
      return {
        ...item,
        categoryName: item.category?.name || 'Uncategorized',
        categoryId: item.category?._id || null,
        isLinkedToProduct: !!matchedProduct,
        linkedProductId: matchedProduct?._id || null,
        linkedProductSlug: matchedProduct?.slug || null,
      };
    });
    
    const matchedCount = inventoryWithStatus.filter(i => i.isLinkedToProduct).length;
    
    // Apply product status filter
    let filteredInventory = inventoryWithStatus;
    if (productStatus === 'uploaded') {
      filteredInventory = inventoryWithStatus.filter(item => item.isLinkedToProduct);
    } else if (productStatus === 'not_uploaded') {
      filteredInventory = inventoryWithStatus.filter(item => !item.isLinkedToProduct);
    }
    
    return NextResponse.json({
      success: true,
      inventory: filteredInventory,
      totalItems: filteredInventory.length,
      stats: {
        total: inventoryWithStatus.length,
        uploaded: matchedCount,
        notUploaded: inventoryWithStatus.length - matchedCount,
      }
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
    
    const requiredFields = ['date', 'productName', 'category', 'initialQty', 'currentQty', 'purchaseRate', 'CPP', 'saleRate'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ success: false, message: `${field} is required` }, { status: 400 });
      }
    }
    
    let barcode = body.barcode;
    if (!barcode || barcode === '') {
      barcode = await generateUniqueBarcode();
    } else {
      const existingItem = await Inventory.findOne({ barcode });
      if (existingItem) {
        return NextResponse.json({ success: false, message: 'Barcode already exists' }, { status: 400 });
      }
    }
    
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