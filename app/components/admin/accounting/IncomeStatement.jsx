// app/components/admin/accounting/IncomeStatement.jsx
"use client";

import React, { useEffect, useState } from "react";
import { FiCalendar, FiRefreshCw, FiPrinter, FiLoader } from "react-icons/fi";
import toast from "react-hot-toast";

const IncomeStatement = () => {
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

  const accountTotals = {};

  transactions.forEach((tx) => {
    const { amount } = tx;

    tx.debitAccounts.forEach((acc) => {
      const name = acc.name;
      accountTotals[name] = (accountTotals[name] || 0) + amount;
    });

    tx.creditAccounts.forEach((acc) => {
      const name = acc.name;
      accountTotals[name] = (accountTotals[name] || 0) + amount;
    });
  });

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    
    const printableContent = document.querySelector(".printable-area").innerHTML;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Income Statement</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 20px;
            }
            .title-box {
              text-align: center;
              margin-bottom: 20px;
            }
            .title-box h1, .title-box h2, .title-box h3 {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .text-right {
              text-align: right;
            }
            .font-bold {
              font-weight: bold;
            }
            .border-bottom {
              border-bottom: 1px solid #000;
            }
            .ml-2 {
              padding-left: 20px;
            }
          </style>
        </head>
        <body>
          <div class="title-box">
            <h1>LiZ Fashions</h1>
            <h2>Statement of Comprehensive Income</h2>
            <h3>From ${startDate} to ${endDate}</h3>
          </div>
          ${printableContent}
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Calculations
  const netSales = (accountTotals?.Sales || 0) - (accountTotals["Sales Return"] || 0);
  const netPurchase = (accountTotals?.Purchase || 0) - (accountTotals["Purchase Return"] || 0);
  const costOfGoodsSold = (accountTotals["Opening Inventory"] || 0) + netPurchase + (accountTotals["Transportation Cost"] || 0) - (accountTotals["Closing Inventory"] || 0);
  const grossProfit = netSales - costOfGoodsSold;
  
  const totalOperatingExpenses = 
    (accountTotals?.["Advertisement"] || 0) +
    (accountTotals?.["Delivery Charges"] || 0) +
    (accountTotals?.["Depreciation"] || 0) +
    (accountTotals?.["Internet & Phone"] || 0) +
    (accountTotals?.["Miscellaneous Expense"] || 0) +
    (accountTotals?.["Packaging Expenses"] || 0) +
    (accountTotals?.["Rent Expense"] || 0) +
    (accountTotals?.["Repairs & Maintenance"] || 0) +
    (accountTotals?.["Salaries & Wages"] || 0) +
    (accountTotals?.["Software/Subscription Fees"] || 0) +
    (accountTotals?.["Supplies Expense"] || 0) +
    (accountTotals?.["Utility Bills"] || 0) +
    (accountTotals?.["Bad Debt"] || 0);
  
  const operatingProfit = grossProfit - totalOperatingExpenses;
  
  const totalOtherIncome = 
    (accountTotals?.["Discounts Received"] || 0) +
    (accountTotals?.["Commission/Other Income"] || 0) +
    (accountTotals?.["Profit From Asset Selling"] || 0);
  
  const totalOtherExpenses = 
    (accountTotals?.["Loss From Selling Fixed Assets"] || 0) +
    (accountTotals?.["Bank Charges"] || 0) +
    (accountTotals?.["Interest on Loan"] || 0) +
    (accountTotals?.["Theft or Accidental Losses"] || 0);
  
  const netProfitLoss = operatingProfit + totalOtherIncome - totalOtherExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Income Statement</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <FiPrinter /> Print
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
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
          <button type="submit" className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2">
            <FiRefreshCw /> Fetch
          </button>
        </form>
      </div>

      {/* Income Statement Table */}
      <div className="printable-area">
        {loading ? (
          <div className="flex justify-center items-center py-12 bg-white border border-gray-200 rounded-lg">
            <FiLoader className="animate-spin text-3xl text-yellow-500" />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-800">Particulars</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-800 w-32">Taka</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-800 w-32">Taka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Sales Section */}
                  <tr>
                    <td className="px-4 py-2 text-gray-600">Sales</td>
                    <td className="px-4 py-2 text-gray-600 text-right">{accountTotals?.Sales?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-gray-600 text-right"></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-gray-600">Less: Sales Return</td>
                    <td className="px-4 py-2 text-gray-600 text-right">({accountTotals["Sales Return"]?.toLocaleString() || 0})</td>
                    <td className="px-4 py-2 text-gray-600 text-right"></td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 text-gray-600 font-bold">Net Sales</td>
                    <td className="px-4 py-2 text-gray-600 text-right font-bold">{netSales.toLocaleString()}</td>
                    <td className="px-4 py-2text-gray-600 text-right"></td>
                  </tr>

                  {/* Cost of Goods Sold */}
                  <tr>
                    <td className="px-4 py-2 text-gray-600 font-bold">Less: Cost of Goods Sold</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr>
                    <td className="px-4 text-gray-600 py-2 pl-8">Opening Inventory</td>
                    <td className="px-4 py-2 text-gray-600 text-right">{accountTotals["Opening Inventory"]?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-gray-600 pl-8">Purchase</td>
                    <td className="px-4 py-2 text-gray-600 text-right">{accountTotals?.Purchase?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-gray-600 pl-8">Less: Purchase Return</td>
                    <td className="px-4 py-2 text-gray-600 text-right">({accountTotals["Purchase Return"]?.toLocaleString() || 0})</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-gray-600 pl-8 font-bold">Net Purchase</td>
                    <td className="px-4 py-2 text-gray-600 text-right font-bold">{netPurchase.toLocaleString()}</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-gray-600 pl-8">Transportation Cost</td>
                    <td className="px-4 py-2 text-gray-600 text-right">{accountTotals["Transportation Cost"]?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-gray-600 pl-8">Less: Closing Inventory</td>
                    <td className="px-4 py-2 text-gray-600 text-right">({accountTotals["Closing Inventory"]?.toLocaleString() || 0})</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 text-gray-600 font-bold">Cost of Goods Sold</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                    <td className="px-4 py-2 text-gray-600 text-right font-bold">({costOfGoodsSold.toLocaleString()})</td>
                  </tr>

                  {/* Gross Profit */}
                  <tr className="border-b border-gray-300">
                    <td className="px-4 py-2 text-gray-600 font-bold">Gross Profit</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                    <td className="px-4 py-2 text-gray-600 text-right font-bold">{grossProfit.toLocaleString()}</td>
                  </tr>

                  {/* Operating Expenses */}
                  <tr>
                    <td className="px-4 py-2 text-gray-600 font-bold">Less: Operating Expenses</td>
                    <td className="px-4 py-2 text-gray-600"></td>
                    <td className="px-4 py-2 text-gray-600"></td>
                  </tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Advertisement</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Advertisement"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Delivery Charges</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Delivery Charges"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Depreciation</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Depreciation"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Internet & Phone</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Internet & Phone"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Miscellaneous Expense</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Miscellaneous Expense"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Packaging Expenses</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Packaging Expenses"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Rent Expense</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Rent Expense"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Repairs & Maintenance</td><td className="text-gray-600 px-4 py=2 text-right">{accountTotals?.["Repairs & Maintenance"]?.toLocaleString() || 0}</td><td className="px-4 py=2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Salaries & Wages</td><td className=" text-gray-600 px-4 py-2 text-right">{accountTotals?.["Salaries & Wages"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Software/Subscription Fees</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Software/Subscription Fees"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Supplies Expense</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Supplies Expense"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Utility Bills</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Utility Bills"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Bad Debt</td><td className="text-gray-600 px-4 py-2 text-right">{accountTotals?.["Bad Debt"]?.toLocaleString() || 0}</td><td className="px-4 py-2 text-gray-600"></td></tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 text-gray-600 py-2 font-bold">Total Operating Expenses</td>
                    <td className="px-4 text-gray-600 py-2"></td>
                    <td className="px-4 text-gray-600 py-2 text-right font-bold">({totalOperatingExpenses.toLocaleString()})</td>
                  </tr>

                  {/* Operating Profit */}
                  <tr className="border-b border-gray-300">
                    <td className="px-4 text-gray-600 py-2 font-bold">Operating Profit</td>
                    <td className="px-4 text-gray-600 py-2"></td>
                    <td className="px-4 text-gray-600 py-2 text-right font-bold">{operatingProfit.toLocaleString()}</td>
                  </tr>

                  {/* Other Income */}
                  <tr>
                    <td className="px-4 text-gray-600 py-2 font-bold">Other Incomes:</td>
                    <td className="px-4 text-gray-600 py-2"></td>
                    <td className="px-4 text-gray-600 py-2"></td>
                  </tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Discounts Received</td><td className="px-4 text-gray-600 py-2 text-right">{accountTotals?.["Discounts Received"]?.toLocaleString() || 0}</td><td className="px-4 text-gray-600 py-2"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Commission/Other Income</td><td className="px-4 text-gray-600 py-2 text-right">{accountTotals?.["Commission/Other Income"]?.toLocaleString() || 0}</td><td className="px-4 text-gray-600 py-2"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Profit From Asset Selling</td><td className="px-4 text-gray-600 py-2 text-right">{accountTotals?.["Profit From Asset Selling"]?.toLocaleString() || 0}</td><td className="px-4 text-gray-600 py-2"></td></tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 text-gray-600 py-2 font-bold">Total Other Income</td>
                    <td className="px-4 text-gray-600 py-2"></td>
                    <td className="px-4 text-gray-600 py-2 text-right font-bold">{totalOtherIncome.toLocaleString()}</td>
                  </tr>

                  {/* Other Expenses */}
                  <tr>
                    <td className="px-4 text-gray-600 py-2 font-bold">Less: Other Expenses</td>
                    <td className="px-4 text-gray-600 py-2"></td>
                    <td className="px-4 text-gray-600 py-2"></td>
                  </tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Loss From Selling Fixed Assets</td><td className="px-4 text-gray-600 py-2 text-right">{accountTotals?.["Loss From Selling Fixed Assets"]?.toLocaleString() || 0}</td><td className="px-4 text-gray-600 py-2"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Bank Charges</td><td className="px-4 text-gray-600 py-2 text-right">{accountTotals?.["Bank Charges"]?.toLocaleString() || 0}</td><td className="px-4 text-gray-600 py-2"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Interest on Loan</td><td className="px-4 text-gray-600 py-2 text-right">{accountTotals?.["Interest on Loan"]?.toLocaleString() || 0}</td><td className="px-4 text-gray-600 py-2"></td></tr>
                  <tr><td className="px-4 text-gray-600 py-2 pl-8">Theft or Accidental Losses</td><td className="px-4 text-gray-600 py-2 text-right">{accountTotals?.["Theft or Accidental Losses"]?.toLocaleString() || 0}</td><td className="px-4 text-gray-600 py-2"></td></tr>
                  <tr className="border-b border-gray-300">
                    <td className="px-4 text-gray-600 py-2 font-bold">Total Other Expenses</td>
                    <td className="px-4 text-gray-600 py-2"></td>
                    <td className="px-4 text-gray-600 py-2 text-right font-bold">({totalOtherExpenses.toLocaleString()})</td>
                  </tr>

                  {/* Net Profit/Loss */}
                  <tr className="bg-gray-50">
                    <td className="px-4 text-gray-600 py-3 font-bold text-lg">Net Profit/Loss</td>
                    <td className="px-4 text-gray-600 py-2"></td>
                    <td className={`px-4 text-gray-600 py-3 text-right font-bold text-lg ${netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {netProfitLoss.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeStatement;