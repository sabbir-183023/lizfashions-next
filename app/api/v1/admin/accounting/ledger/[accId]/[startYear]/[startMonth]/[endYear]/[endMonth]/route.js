// app/api/v1/admin/accounting/ledger/[accId]/[startYear]/[startMonth]/[endYear]/[endMonth]/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Transaction from '@/app/models/Transaction';
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
    
    const { accId, startYear, startMonth, endYear, endMonth } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(accId)) {
      return NextResponse.json({ success: false, message: 'Invalid account ID' }, { status: 400 });
    }
    
    // Get account details
    const account = await Accounts.findById(accId);
    
    if (!account) {
      return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
    }
    
    // Create date range
    const startDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
    const endDate = new Date(parseInt(endYear), parseInt(endMonth), 0); // Last day of end month
    
    // Find transactions where this account is either debited or credited
    const transactions = await Transaction.find({
      $and: [
        {
          $or: [
            { debitAccounts: new mongoose.Types.ObjectId(accId) },
            { creditAccounts: new mongoose.Types.ObjectId(accId) }
          ]
        },
        { date: { $gte: startDate, $lte: endDate } }
      ]
    })
    .populate('debitAccounts', 'name accountingEquation defaultAcc')
    .populate('creditAccounts', 'name accountingEquation defaultAcc')
    .sort({ date: 1 });
    
    return NextResponse.json({
      success: true,
      transactions,
      account
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching ledger:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch ledger",
      error: error.message
    }, { status: 500 });
  }
}