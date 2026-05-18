// app/components/admin/accounting/Transactions.jsx
"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import toast from "react-hot-toast";
import { FiPlus, FiRefreshCw, FiArrowDown, FiArrowUp, FiLoader, FiChevronDown } from "react-icons/fi";

const Transactions = () => {
  const getLocalDate = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split("T")[0];
  };

  const [accounts, setAccounts] = useState([]);
  const [debitAccounts, setDebitAccounts] = useState([]);
  const [creditAccounts, setCreditAccounts] = useState([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [getTransLoading, setGetTranLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/accounting")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAccounts(data.accounts);
        }
      })
      .catch(error => {
        console.error("Error fetching accounts:", error);
        toast.error("Failed to load accounts");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitLoading(true);
      const response = await fetch("/api/v1/admin/accounting/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debitAccounts: debitAccounts.map((acc) => acc.value),
          creditAccounts: creditAccounts.map((acc) => acc.value),
          amount: parseFloat(amount),
          date,
          remarks,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setAmount("");
        setCreditAccounts([]);
        setDebitAccounts([]);
        setRemarks("");
        setPage(1);
        getAllTransactions(1);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error in adding transaction!");
    } finally {
      setSubmitLoading(false);
    }
  };

  const getAllTransactions = async (pageNum = 1, append = false) => {
    setGetTranLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/accounting/transactions?page=${pageNum}&limit=20`);
      const data = await response.json();
      if (data.success) {
        if (append) {
          setTransactions(prev => [...prev, ...(data.transactions || [])]);
        } else {
          setTransactions(data.transactions || []);
        }
        setHasMore(data.pagination.currentPage < data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load transactions");
    } finally {
      setGetTranLoading(false);
    }
  };

  useEffect(() => {
    getAllTransactions(1, false);
  }, []);

  const loadMore = async () => {
    setLoadMoreLoading(true);
    await getAllTransactions(page + 1, true);
    setLoadMoreLoading(false);
  };

  const getTransactionType = (transaction) => {
    const hasCashDebit = transaction.debitAccounts?.some(a => a?.name === "Cash");
    const hasBankDebit = transaction.debitAccounts?.some(a => a?.name === "Bank");
    const hasCashCredit = transaction.creditAccounts?.some(a => a?.name === "Cash");
    const hasBankCredit = transaction.creditAccounts?.some(a => a?.name === "Bank");

    if (hasCashDebit || hasBankDebit) return "income";
    if (hasCashCredit || hasBankCredit) return "expense";
    return "transfer";
  };

  const accountOptions = accounts.map((acc) => ({
    value: acc._id,
    label: `${acc.name} (${acc.accountingEquation})`,
    data: acc
  }));

  const customStyles = {
    control: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: '#d1d5db',
      fontSize: '0.875rem',
      minHeight: '42px',
    }),
  };

  return (
    <div className="space-y-6">
      {/* Add Transaction Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiPlus /> Record New Transaction
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Debit Accounts</label>
              <Select
                options={accountOptions}
                isMulti
                isSearchable
                value={debitAccounts}
                onChange={setDebitAccounts}
                styles={customStyles}
                placeholder="Select debit accounts..."
                className="text-gray-600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Accounts</label>
              <Select
                options={accountOptions}
                isMulti
                isSearchable
                value={creditAccounts}
                onChange={setCreditAccounts}
                styles={customStyles}
                placeholder="Select credit accounts..."
                className="text-gray-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter transaction description..."
              rows="3"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitLoading}
              className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {submitLoading ? (
                <><FiLoader className="animate-spin" /> Processing...</>
              ) : (
                <><FiPlus /> Record Transaction</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
          <button
            onClick={() => getAllTransactions(1, false)}
            className="text-gray-500 hover:text-yellow-500 transition-colors"
            title="Refresh"
          >
            <FiRefreshCw />
          </button>
        </div>

        {getTransLoading && transactions.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <FiLoader className="animate-spin text-3xl text-yellow-500" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction, index) => {
                const type = getTransactionType(transaction);
                
                return (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">
                        {transaction.date?.split("T")[0]}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        type === "income" ? "bg-green-100 text-green-700" :
                        type === "expense" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {type === "income" ? <FiArrowDown /> : type === "expense" ? <FiArrowUp /> : "↔"}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-gray-500">Debit:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {transaction.debitAccounts?.map((acc, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {acc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-xs text-gray-500">Credit:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {transaction.creditAccounts?.map((acc, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                              {acc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                      <span className="text-sm font-bold text-gray-800">
                        ৳ {parseFloat(transaction.amount).toLocaleString()}
                      </span>
                      {transaction.remarks && (
                        <span className="text-xs text-gray-400 italic">{transaction.remarks}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {hasMore && (
              <div className="p-4 border-t border-gray-200 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadMoreLoading}
                  className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadMoreLoading ? (
                    <><FiLoader className="animate-spin" /> Loading...</>
                  ) : (
                    <>Load More Transactions <FiChevronDown /></>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiRefreshCw className="text-4xl mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium">No Transactions Found</h3>
            <p className="text-sm">Record your first transaction to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;