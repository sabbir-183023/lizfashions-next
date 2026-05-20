// app/components/admin/accounting/Expense.jsx
"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import {
  FaPrint,
  FaEdit,
  FaTrash,
  FaSearch,
  FaTimes,
  FaSpinner,
  FaSave,
  FaPlus,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import toast from "react-hot-toast";
import moment from "moment";

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Add form state
  const [addFormData, setAddFormData] = useState({
    expenseName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    expenseName: "",
    amount: "",
    date: "",
    remarks: "",
  });

  // Fetch expenses data
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/v1/admin/accounting/expense?limit=500";
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setExpenses(data.expenses);
        setFilteredExpenses(data.expenses);
        setTotalExpenses(data.total);
      } else {
        toast.error(data.message || "Failed to fetch expenses");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Apply search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = expenses.filter(
        (expense) =>
          expense.expenseName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          expense.remarks?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredExpenses(filtered);
    } else {
      setFilteredExpenses(expenses);
    }
  }, [searchTerm, expenses]);

  // Calculate totals
  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExpense = async () => {
    if (!addFormData.expenseName || !addFormData.amount || !addFormData.date) {
      toast.error("Expense name, amount, and date are required");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/v1/admin/accounting/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseName: addFormData.expenseName,
          amount: parseFloat(addFormData.amount),
          date: addFormData.date,
          remarks: addFormData.remarks,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Expense added successfully");
        setAddFormData({
          expenseName: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          remarks: "",
        });
        setIsAddModalOpen(false);
        fetchExpenses();
      } else {
        toast.error(data.message || "Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setAdding(false);
    }
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      expenseName: expense.expenseName,
      amount: expense.amount,
      date: moment(expense.date).format("YYYY-MM-DD"),
      remarks: expense.remarks || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateExpense = async () => {
    setUpdating(true);
    try {
      const response = await fetch(
        `/api/v1/admin/accounting/expense/${editingExpense._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expenseName: editFormData.expenseName,
            amount: parseFloat(editFormData.amount),
            date: editFormData.date,
            remarks: editFormData.remarks,
          }),
        },
      );
      const data = await response.json();

      if (data.success) {
        // Update local state
        const updatedExpenses = expenses.map((expense) =>
          expense._id === editingExpense._id ? data.expense : expense,
        );
        setExpenses(updatedExpenses);
        setFilteredExpenses(
          searchTerm
            ? updatedExpenses.filter(
                (e) =>
                  e.expenseName
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  e.remarks?.toLowerCase().includes(searchTerm.toLowerCase()),
              )
            : updatedExpenses,
        );
        toast.success("Expense updated successfully");
        setIsEditModalOpen(false);
      } else {
        toast.error(data.message || "Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = async (expenseId, expenseName) => {
    if (!confirm(`Are you sure you want to delete expense "${expenseName}"?`)) {
      return;
    }

    setDeletingId(expenseId);
    try {
      const response = await fetch(
        `/api/v1/admin/accounting/expense/${expenseId}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();

      if (data.success) {
        // Remove from local state
        const updatedExpenses = expenses.filter(
          (expense) => expense._id !== expenseId,
        );
        setExpenses(updatedExpenses);
        const updatedFiltered = searchTerm
          ? updatedExpenses.filter(
              (e) =>
                e.expenseName
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                e.remarks?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
          : updatedExpenses;
        setFilteredExpenses(updatedFiltered);
        toast.success("Expense deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printDate = new Date().toLocaleString();

    const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Expense Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            color: #1e3a8a;
            margin: 0;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: left;
            background-color: #f2f2f2;
            font-weight: bold;
          }
          td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .totals-row {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .totals-row td {
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Expense Report</h1>
          <p>Generated on: ${printDate}</p>
          ${startDate && endDate ? `<p>Period: ${startDate} to ${endDate}</p>` : ""}
          <p>Total Records: ${filteredExpenses.length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Name</th>
              <th class="text-right">Amount</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${filteredExpenses
              .map(
                (expense) => `
              <tr>
                <td>${moment(expense.date).format("DD-MM-YYYY")}</td>
                <td>${expense.expenseName}</td>
                <td class="text-right">৳${expense.amount.toLocaleString()}</td>
                <td>${expense.remarks || "-"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="2"><strong>Total Expenses</strong></td>
              <td class="text-right"><strong>৳${totalAmount.toLocaleString()}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="footer">
          <p>Generated by Expense Management System</p>
          <p>This is a computer generated report</p>
        </div>
        
        <script>
          // Auto-trigger print after content loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // Do NOT close the window - let user close it manually
            }, 1000);
          };
        </script>
      </body>
    </html>
  `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  // useEffect(() => {
  //   first

  //   return () => {
  //     second
  //   }
  // }, [third])

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(129vh)] md:h-[calc(90vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaMoneyBillWave /> Expense Management
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Track and manage all business expenses
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-yellow-400 text-blue-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPlus /> Add Expense
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPrint /> Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Expenses</p>
          <p className="text-lg font-bold text-gray-800">
            {filteredExpenses.length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="text-lg font-bold text-red-600">
            ৳{totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Average Expense</p>
          <p className="text-lg font-bold text-orange-600">
            ৳
            {filteredExpenses.length
              ? (totalAmount / filteredExpenses.length).toFixed(2)
              : 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 flex-shrink-0 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by expense name or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Start Date */}
          <div className="sm:w-48">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              placeholder="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="sm:w-48">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              placeholder="End Date"
            />
          </div>

          {/* Clear Filters */}
          {(searchTerm || startDate || endDate) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaTimes className="inline mr-1" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expense Name
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Remarks
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <FaSpinner className="animate-spin text-3xl text-yellow-500" />
                    </div>
                    <p className="text-gray-500 mt-2">Loading expenses...</p>
                  </td>
                </tr>
              ) : currentExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                currentExpenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                      {moment(expense.date).format("DD-MM-YYYY")}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-800">
                      {expense.expenseName}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm font-semibold text-red-600">
                      ৳{expense.amount?.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                      {expense.remarks || "-"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditClick(expense)}
                          disabled={deletingId === expense._id}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 disabled:opacity-50"
                          title="Edit"
                        >
                          <FaEdit className="text-xs sm:text-sm" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClick(expense._id, expense.expenseName)
                          }
                          disabled={deletingId === expense._id}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === expense._id ? (
                            <FaSpinner className="animate-spin text-xs" />
                          ) : (
                            <FaTrash className="text-xs sm:text-sm" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-100 sticky bottom-0">
              <tr>
                <td
                  colSpan="2"
                  className="px-3 sm:px-4 py-3 text-sm font-bold text-gray-800"
                >
                  Total
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-red-700">
                  ৳{totalAmount.toLocaleString()}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, filteredExpenses.length)} of{" "}
              {filteredExpenses.length} expenses
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus /> Add New Expense
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddExpense();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="expenseName"
                    value={addFormData.expenseName}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g., Office Rent, Electricity Bill"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={addFormData.amount}
                    onChange={handleAddInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="৳"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={addFormData.date}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    name="remarks"
                    value={addFormData.remarks}
                    onChange={handleAddInputChange}
                    rows="3"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {adding ? (
                      <>
                        <FaSpinner className="animate-spin" /> Adding...
                      </>
                    ) : (
                      <>
                        <FaSave /> Add Expense
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {isEditModalOpen && editingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaEdit /> Edit Expense
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateExpense();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="expenseName"
                    value={editFormData.expenseName}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={editFormData.amount}
                    onChange={handleEditInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={editFormData.date}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    name="remarks"
                    value={editFormData.remarks}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <FaSpinner className="animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <FaSave /> Update Expense
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expense;
