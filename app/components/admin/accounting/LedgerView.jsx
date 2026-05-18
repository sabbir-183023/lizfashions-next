// app/components/admin/accounting/LedgerView.jsx
"use client";

import { useEffect, useState } from "react";
import { FaSearch, FaArrowAltCircleLeft, FaPrint } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import moment from "moment";
import toast from "react-hot-toast";

const LedgerView = ({ accountId, onBack }) => {
  // Default to current year & month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const shortMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const [transactions, setTransactions] = useState([]);
  const [account, setAccount] = useState({});
  const [startYear, setStartYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [endYear, setEndYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [getDataLoading, setGetDataLoading] = useState(false);

  // Fetch Data with Selected Range
  const getData = async () => {
    if (!accountId) return;
    
    try {
      setGetDataLoading(true);
      const response = await fetch(
        `/api/v1/admin/accounting/ledger/${accountId}/${startYear}/${startMonth}/${endYear}/${endMonth}`
      );
      const data = await response.json();
      
      if (data?.success) {
        setTransactions(data?.transactions);
        setAccount(data?.account);
      } else {
        toast.error(data?.message || "Failed to fetch ledger");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch ledger");
    } finally {
      setGetDataLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      getData();
    }
  }, [accountId]);

  const handleSearch = () => {
    getData();
  };

  // Calculate Total Debit and Credit
  const totalDebit = transactions
    .filter((t) => t.debitAccounts?.some((acc) => acc.name === account?.name))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredit = transactions
    .filter((t) => t.creditAccounts?.some((acc) => acc.name === account?.name))
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate Ledger Balance
  const balance =
    account?.defaultAcc === "Debit"
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printDateTime = new Date().toLocaleString();
    const reportDuration = `From: ${shortMonthNames[startMonth - 1]}, ${startYear} - To: ${shortMonthNames[endMonth - 1]}, ${endYear}`;

    const tableHtml = document.querySelector(".ledger-table-container")?.innerHTML || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${account?.name} Account - Ledger Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Piedra&display=swap');
            
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 20px;
            }
            .company {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .co-name {
              text-align: right;
            }
            .co-name h1 {
              font-family: "Piedra", serif;
              font-weight: 400;
              font-style: normal;
              color: #542724;
              font-size: 24px;
              margin: 0;
            }
            .co-name p {
              font-style: italic;
              color: #b59410;
              font-size: 12px;
              margin: 0;
            }
            .account-name {
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              text-align: center;
              color: #1e3a8a;
            }
            .report-info {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin: 10px 0;
              padding: 5px 0;
              border-bottom: 1px solid #ccc;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              margin-top: 15px;
            }
            th, td {
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="company">
            <div class="co-name">
              <h1>LiZ Fashions</h1>
              <p>880 1303 934 257</p>
              <p>support@lizfashions.store</p>
            </div>
          </div>
          
          <div class="account-name">${account?.name} Account</div>
          
          <div class="report-info">
            <div><strong>Period:</strong> ${reportDuration}</div>
            <div><strong>Printed on:</strong> ${printDateTime}</div>
          </div>
          
          <div class="ledger-table-container">
            ${tableHtml}
          </div>
          
          <div class="footer">
            <p>This is a computer generated report</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  // Generate year options (last 10 years and next 5 years)
  const yearOptions = [];
  for (let i = currentYear - 10; i <= currentYear + 5; i++) {
    yearOptions.push(i);
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Back to Accounts"
          >
            <FaArrowAltCircleLeft className="text-2xl" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Ledger: {account?.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {account?.accountingEquation} • {account?.defaultAcc} Balance
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <FaPrint /> Print Ledger
        </button>
      </div>

      {/* Date Range Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From:</label>
            <div className="flex gap-2">
              <select
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value))}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(parseInt(e.target.value))}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                {monthNames.map((month, i) => (
                  <option key={i} value={i + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">To:</label>
            <div className="flex gap-2">
              <select
                value={endYear}
                onChange={(e) => setEndYear(parseInt(e.target.value))}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <select
                value={endMonth}
                onChange={(e) => setEndMonth(parseInt(e.target.value))}
                className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                {monthNames.map((month, i) => (
                  <option key={i} value={i + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2"
          >
            <FaSearch /> Search
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="ledger-table-container overflow-x-auto">
          {getDataLoading ? (
            <div className="flex justify-center items-center py-12">
              <FiLoader className="animate-spin text-3xl text-yellow-500" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit (৳)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions?.length > 0 ? (
                  <>
                    {transactions?.map((t, i) => {
                      const isDebit = t?.debitAccounts?.some(
                        (acc) => acc.name === account?.name
                      );
                      const isCredit = t?.creditAccounts?.some(
                        (acc) => acc.name === account?.name
                      );

                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {moment(t?.date).format("DD-MM-YYYY")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {isDebit
                              ? t?.creditAccounts?.map((acc) => acc?.name).join(", ")
                              : t?.debitAccounts?.map((acc) => acc?.name).join(", ")}
                            {t?.remarks && (
                              <span className="text-gray-400 text-xs ml-1">
                                ({t?.remarks})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                            {isDebit ? `৳ ${t?.amount.toLocaleString()}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                            {isCredit ? `৳ ${t?.amount.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Totals Row */}
                    <tr className="bg-gray-50 border-t-2 border-gray-300">
                      <td colSpan="2" className="px-4 py-3 text-sm font-bold text-gray-800">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                        ৳ {totalDebit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-red-600">
                        ৳ {totalCredit.toLocaleString()}
                      </td>
                    </tr>
                    
                    {/* Balance Row */}
                    <tr className="bg-yellow-50">
                      <td colSpan="2" className="px-4 py-3 text-sm font-bold text-gray-800">
                        Balance ({account?.defaultAcc})
                      </td>
                      <td colSpan="2" className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                        ৳ {Math.abs(balance).toLocaleString()} {balance >= 0 ? "Dr" : "Cr"}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-500">
                      No transactions found for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Account Summary Cards */}
      {account && transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs text-green-600 mb-1">Total Debit</p>
            <p className="text-2xl font-bold text-green-700">৳ {totalDebit.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs text-red-600 mb-1">Total Credit</p>
            <p className="text-2xl font-bold text-red-700">৳ {totalCredit.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-600 mb-1">Balance ({account?.defaultAcc})</p>
            <p className="text-2xl font-bold text-blue-700">
              ৳ {Math.abs(balance).toLocaleString()} {balance >= 0 ? "Dr" : "Cr"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerView;