// app/api/v1/admin/accounting/datewise-transactions/route.js
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Transaction from '@/app/models/Transaction';
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
    
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const transactions = await Transaction.find(query)
      .populate('debitAccounts', 'name accountingEquation defaultAcc')
      .populate('creditAccounts', 'name accountingEquation defaultAcc')
      .sort({ date: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      transactions
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching date-wise transactions:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    }, { status: 500 });
  }
}