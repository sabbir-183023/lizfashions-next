// app/components/admin/accounting/Overview.jsx
"use client";

import React, { useEffect, useState } from "react";
import { FiCalendar, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";

const Overview = () => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/admin/accounting/datewise-transactions?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const accountMap = {};
  transactions.forEach((tx) => {
    const { amount } = tx;
    tx.debitAccounts.forEach((acc) => {
      accountMap[acc.name] = (accountMap[acc.name] || 0) + amount;
    });
    tx.creditAccounts.forEach((acc) => {
      accountMap[acc.name] = (accountMap[acc.name] || 0) + amount;
    });
  });

  const result = Object.entries(accountMap).map(([account, amount]) => ({
    account,
    amount: parseFloat(amount).toFixed(2),
  }));

  const getAccountCategory = (accountName) => {
    const incomeAccounts = ['Sales', 'Revenue', 'Income'];
    const expenseAccounts = ['Expense', 'Cost', 'Purchase', 'Salary'];
    const assetAccounts = ['Cash', 'Bank', 'Inventory', 'Asset'];
    const liabilityAccounts = ['Loan', 'Debt', 'Liability'];
    
    if (incomeAccounts.some(term => accountName.includes(term))) return 'income';
    if (expenseAccounts.some(term => accountName.includes(term))) return 'expense';
    if (assetAccounts.some(term => accountName.includes(term))) return 'asset';
    if (liabilityAccounts.some(term => accountName.includes(term))) return 'liability';
    return 'other';
  };

  const totalAmount = result.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <FiTrendingUp /> Financial Overview
        </h2>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <FiCalendar /> {startDate} to {endDate}
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <FiCalendar /> Select Period
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
            />
          </div>
          <button type="submit" className="mt-5 bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2">
            <FiRefreshCw /> Update Report
          </button>
        </form>
      </div>

      {/* Account Summary Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Account Summary</h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FiLoader className="animate-spin text-3xl text-yellow-500" />
          </div>
        ) : result.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Account Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {result.map((data, index) => {
                  const category = getAccountCategory(data.account);
                  const isPositive = category === 'income' || category === 'asset';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{data.account}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          category === 'income' ? 'bg-green-100 text-green-700' :
                          category === 'expense' ? 'bg-red-100 text-red-700' :
                          category === 'asset' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        ৳ {parseFloat(data.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {isPositive ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <FiTrendingUp /> Income
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <FiTrendingDown /> Expense
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan="2" className="px-4 py-3 text-sm font-bold text-gray-800">Grand Total</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">৳ {totalAmount.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiTrendingUp className="text-4xl mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium">No Transactions Found</h3>
            <p className="text-sm">No transactions recorded for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;