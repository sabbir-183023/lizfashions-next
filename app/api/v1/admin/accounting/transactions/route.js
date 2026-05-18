// app/api/v1/admin/accounting/transactions/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Transaction from '@/app/models/Transaction';
import Accounts from '@/app/models/Accounts';
import { getAuthToken, verifyToken } from '@/app/lib/authUtils';
import mongoose from 'mongoose';

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
    const { debitAccounts, creditAccounts, amount, date, remarks } = body;
    
    if (!debitAccounts || debitAccounts.length === 0) {
      return NextResponse.json({ success: false, message: "Debit accounts are required" }, { status: 400 });
    }
    
    if (!creditAccounts || creditAccounts.length === 0) {
      return NextResponse.json({ success: false, message: "Credit accounts are required" }, { status: 400 });
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "Valid amount is required" }, { status: 400 });
    }
    
    if (!date) {
      return NextResponse.json({ success: false, message: "Date is required" }, { status: 400 });
    }
    
    const transaction = await Transaction.create({
      debitAccounts: debitAccounts.map(id => new mongoose.Types.ObjectId(id)),
      creditAccounts: creditAccounts.map(id => new mongoose.Types.ObjectId(id)),
      amount,
      date: new Date(date),
      remarks: remarks || ""
    });
    
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('debitAccounts', 'name accountingEquation defaultAcc')
      .populate('creditAccounts', 'name accountingEquation defaultAcc');
    
    return NextResponse.json({
      success: true,
      message: "Transaction recorded successfully",
      transaction: populatedTransaction
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create transaction",
      error: error.message
    }, { status: 500 });
  }
}

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const skip = (page - 1) * limit;
    
    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .populate('debitAccounts', 'name accountingEquation defaultAcc')
        .populate('creditAccounts', 'name accountingEquation defaultAcc')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ]);
    
    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    }, { status: 500 });
  }
}