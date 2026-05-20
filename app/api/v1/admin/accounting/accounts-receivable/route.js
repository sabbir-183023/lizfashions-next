// app/api/v1/admin/accounting/accounts-receivable/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import AccountsReceivable from '@/app/models/AccountsReceivable';
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const accounts = await AccountsReceivable.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    
    const total = await AccountsReceivable.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      accounts,
      total
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching accounts receivable:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch accounts receivable",
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
    const { date, dueDate, payerName, payerPhone, payerAddress, amount, remarks } = body;
    
    if (!date || !payerName || !amount) {
      return NextResponse.json({ 
        success: false, 
        message: "Date, payer name, and amount are required" 
      }, { status: 400 });
    }
    
    const account = await AccountsReceivable.create({
      date: new Date(date),
      dueDate: dueDate ? new Date(dueDate) : null,
      payerName,
      payerPhone: payerPhone || "",
      payerAddress: payerAddress || "",
      amount: parseFloat(amount),
      paidAmount: 0,
      remainingAmount: parseFloat(amount),
      status: "unpaid",
      remarks: remarks || ""
    });
    
    return NextResponse.json({
      success: true,
      message: "Account receivable added successfully",
      account
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating account receivable:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create account receivable",
      error: error.message
    }, { status: 500 });
  }
}