// app/api/v1/admin/accounting/expense/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Expense from '@/app/models/Expense';
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
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    
    const total = await Expense.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      expenses,
      total
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch expenses",
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
    const { expenseName, amount, date, remarks } = body;
    
    if (!expenseName || !amount || !date) {
      return NextResponse.json({ 
        success: false, 
        message: "Expense name, amount, and date are required" 
      }, { status: 400 });
    }
    
    const expense = await Expense.create({
      expenseName,
      amount: parseFloat(amount),
      date: new Date(date),
      remarks: remarks || ""
    });
    
    return NextResponse.json({
      success: true,
      message: "Expense added successfully",
      expense
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create expense",
      error: error.message
    }, { status: 500 });
  }
}