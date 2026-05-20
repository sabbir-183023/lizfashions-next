// app/components/admin/accounting/AccountsPayable.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaEye,
  FaCreditCard,
  FaBuilding,
} from "react-icons/fa";
import toast from "react-hot-toast";
import moment from "moment";

const AccountsPayable = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(null);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Add form state
  const [addFormData, setAddFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    amount: "",
    remarks: "",
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    date: "",
    dueDate: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    amount: "",
    paidAmount: "",
    remarks: "",
  });

  // Fetch accounts data
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/v1/admin/accounting/accounts-payable?limit=500";
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
        setFilteredAccounts(data.accounts);
      } else {
        toast.error(data.message || "Failed to fetch accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Apply search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = accounts.filter(
        (account) =>
          account.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.supplierPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAccounts(filtered);
    } else {
      setFilteredAccounts(accounts);
    }
  }, [searchTerm, accounts]);

  // Calculate totals
  const totals = filteredAccounts.reduce(
    (acc, account) => {
      acc.totalAmount += account.amount || 0;
      acc.totalPaid += account.paidAmount || 0;
      acc.totalRemaining += account.remainingAmount || 0;
      return acc;
    },
    { totalAmount: 0, totalPaid: 0, totalRemaining: 0 }
  );

  const statusColors = {
    unpaid: "bg-red-100 text-red-700",
    partial: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    overdue: "bg-orange-100 text-orange-700",
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
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

  const handleAddAccount = async () => {
    if (!addFormData.supplierName || !addFormData.amount || !addFormData.date) {
      toast.error("Supplier name, amount, and date are required");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/v1/admin/accounting/accounts-payable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addFormData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Account payable added successfully");
        setAddFormData({
          date: new Date().toISOString().split("T")[0],
          dueDate: "",
          supplierName: "",
          supplierPhone: "",
          supplierAddress: "",
          amount: "",
          remarks: "",
        });
        setIsAddModalOpen(false);
        fetchAccounts();
      } else {
        toast.error(data.message || "Failed to add account");
      }
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error("Failed to add account");
    } finally {
      setAdding(false);
    }
  };

  const handleEditClick = (account) => {
    setEditingAccount(account);
    setEditFormData({
      date: moment(account.date).format("YYYY-MM-DD"),
      dueDate: account.dueDate ? moment(account.dueDate).format("YYYY-MM-DD") : "",
      supplierName: account.supplierName,
      supplierPhone: account.supplierPhone || "",
      supplierAddress: account.supplierAddress || "",
      amount: account.amount,
      paidAmount: account.paidAmount,
      remarks: account.remarks || "",
    });
    setIsEditModalOpen(true);
  };

  const handleViewClick = (account) => {
    setViewingAccount(account);
    setIsViewModalOpen(true);
  };

  const handlePaymentClick = (account) => {
    setEditingAccount(account);
    setPaymentAmount("");
    setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const newPaidAmount = editingAccount.paidAmount + parseFloat(paymentAmount);
    if (newPaidAmount > editingAccount.amount) {
      toast.error("Payment amount exceeds remaining balance");
      return;
    }

    setPaymentProcessing(true);
    try {
      const response = await fetch(`/api/v1/admin/accounting/accounts-payable/${editingAccount._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingAccount,
          paidAmount: newPaidAmount,
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Payment of ৳${parseFloat(paymentAmount).toLocaleString()} recorded successfully`);
        setIsPaymentModalOpen(false);
        fetchAccounts();
      } else {
        toast.error(data.message || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleUpdateAccount = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/v1/admin/accounting/accounts-payable/${editingAccount._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await response.json();

      if (data.success) {
        const updatedAccounts = accounts.map((account) =>
          account._id === editingAccount._id ? data.account : account
        );
        setAccounts(updatedAccounts);
        setFilteredAccounts(
          searchTerm
            ? updatedAccounts.filter(
                (a) =>
                  a.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.supplierPhone?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : updatedAccounts
        );
        toast.success("Account updated successfully");
        setIsEditModalOpen(false);
      } else {
        toast.error(data.message || "Failed to update account");
      }
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error("Failed to update account");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = async (accountId, supplierName) => {
    if (!confirm(`Are you sure you want to delete account for "${supplierName}"?`)) {
      return;
    }

    setDeletingId(accountId);
    try {
      const response = await fetch(`/api/v1/admin/accounting/accounts-payable/${accountId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        const updatedAccounts = accounts.filter((account) => account._id !== accountId);
        setAccounts(updatedAccounts);
        const updatedFiltered = searchTerm
          ? updatedAccounts.filter(
              (a) =>
                a.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.supplierPhone?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : updatedAccounts;
        setFilteredAccounts(updatedFiltered);
        toast.success("Account deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
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
          <title>Accounts Payable Report</title>
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
            <h1>Accounts Payable Report</h1>
            <p>Generated on: ${printDate}</p>
            ${startDate && endDate ? `<p>Period: ${startDate} to ${endDate}</p>` : ""}
            ${statusFilter ? `<p>Status: ${statusFilter.toUpperCase()}</p>` : ""}
            <p>Total Records: ${filteredAccounts.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Due Date</th>
                <th>Supplier Name</th>
                <th>Phone</th>
                <th class="text-right">Total Amount</th>
                <th class="text-right">Paid Amount</th>
                <th class="text-right">Remaining</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAccounts
                .map(
                  (account) => `
              <tr>
                <td>${moment(account.date).format("DD-MM-YYYY")}</td>
                <td>${account.dueDate ? moment(account.dueDate).format("DD-MM-YYYY") : "-"}</td>
                <td>${account.supplierName}</td>
                <td>${account.supplierPhone || "-"}</td>
                <td class="text-right">৳${account.amount.toLocaleString()}</td>
                <td class="text-right">৳${account.paidAmount.toLocaleString()}</td>
                <td class="text-right">৳${account.remainingAmount.toLocaleString()}</td>
                <td class="text-center">${account.status.toUpperCase()}</td>
              </tr>
            `,
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="totals-row">
                <td colspan="4"><strong>Totals</strong></td>
                <td class="text-right"><strong>৳${totals.totalAmount.toLocaleString()}</strong></td>
                <td class="text-right"><strong>৳${totals.totalPaid.toLocaleString()}</strong></td>
                <td class="text-right"><strong>৳${totals.totalRemaining.toLocaleString()}</strong></td>
                <td class="text-center"></td>
              </tr>
            </tfoot>
          </table>
          
          <div class="footer">
            <p>Generated by Accounts Payable System</p>
            <p>This is a computer generated report</p>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
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
  const currentAccounts = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(129vh)] md:h-[calc(90vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaMoneyBillWave /> Accounts Payable
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Track and manage money owed to suppliers
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-yellow-400 text-blue-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPlus /> Add Account
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Accounts</p>
          <p className="text-lg font-bold text-gray-800">{filteredAccounts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="text-lg font-bold text-blue-600">৳{totals.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-lg font-bold text-green-600">৳{totals.totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Remaining</p>
          <p className="text-lg font-bold text-red-600">৳{totals.totalRemaining.toLocaleString()}</p>
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
              placeholder="Search by supplier name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Start Date */}
          <div className="sm:w-44">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* End Date */}
          <div className="sm:w-44">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">All Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || startDate || endDate || statusFilter) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaTimes className="inline mr-1" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier Name</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <FaSpinner className="animate-spin text-3xl text-yellow-500" />
                    </div>
                    <p className="text-gray-500 mt-2">Loading accounts...</p>
                  </td>
                </tr>
              ) : currentAccounts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    No accounts found
                  </td>
                </tr>
              ) : (
                currentAccounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                      {moment(account.date).format("DD-MM-YYYY")}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                      {account.dueDate ? moment(account.dueDate).format("DD-MM-YYYY") : "-"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-800">
                      {account.supplierName}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-500">
                      {account.supplierPhone || "-"}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm font-semibold text-blue-600">
                      ৳{account.amount?.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm font-semibold text-green-600">
                      ৳{account.paidAmount?.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right text-sm font-semibold text-red-600">
                      ৳{account.remainingAmount?.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[account.status]}`}>
                        {account.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleViewClick(account)}
                          className="text-green-600 hover:text-green-800 transition-colors p-1"
                          title="View Details"
                        >
                          <FaEye className="text-xs sm:text-sm" />
                        </button>
                        <button
                          onClick={() => handlePaymentClick(account)}
                          disabled={account.status === "paid"}
                          className={`text-purple-600 hover:text-purple-800 transition-colors p-1 ${account.status === "paid" ? "opacity-50 cursor-not-allowed" : ""}`}
                          title="Record Payment"
                        >
                          <FaCreditCard className="text-xs sm:text-sm" />
                        </button>
                        <button
                          onClick={() => handleEditClick(account)}
                          disabled={deletingId === account._id}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1 disabled:opacity-50"
                          title="Edit"
                        >
                          <FaEdit className="text-xs sm:text-sm" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(account._id, account.supplierName)}
                          disabled={deletingId === account._id}
                          className="text-red-600 hover:text-red-800 transition-colors p-1 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === account._id ? (
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
                <td colSpan="4" className="px-3 sm:px-4 py-3 text-sm font-bold text-gray-800">
                  Totals
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-blue-700">
                  ৳{totals.totalAmount.toLocaleString()}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-green-700">
                  ৳{totals.totalPaid.toLocaleString()}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-red-700">
                  ৳{totals.totalRemaining.toLocaleString()}
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
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAccounts.length)} of {filteredAccounts.length} accounts
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus /> Add Account Payable
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleAddAccount(); }} className="space-y-4">
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
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={addFormData.dueDate}
                    onChange={handleAddInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="supplierName"
                    value={addFormData.supplierName}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Supplier/Company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="supplierPhone"
                    value={addFormData.supplierPhone}
                    onChange={handleAddInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Contact number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="supplierAddress"
                    value={addFormData.supplierAddress}
                    onChange={handleAddInputChange}
                    rows="2"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Full address"
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
                    Remarks (Optional)
                  </label>
                  <textarea
                    name="remarks"
                    value={addFormData.remarks}
                    onChange={handleAddInputChange}
                    rows="2"
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
                      <><FaSpinner className="animate-spin" /> Adding...</>
                    ) : (
                      <><FaSave /> Add Account</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && editingAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaEdit /> Edit Account
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateAccount(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={editFormData.dueDate}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={editFormData.supplierName}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="supplierPhone"
                    value={editFormData.supplierPhone}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="supplierAddress"
                    value={editFormData.supplierAddress}
                    onChange={handleEditInputChange}
                    rows="2"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={editFormData.paidAmount}
                    onChange={handleEditInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    name="remarks"
                    value={editFormData.remarks}
                    onChange={handleEditInputChange}
                    rows="2"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-lg font-semibold hover:bg-yellow-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    {updating ? <><FaSpinner className="animate-spin" /> Updating...</> : <><FaSave /> Update</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Account Modal */}
      {isViewModalOpen && viewingAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBuilding /> Supplier Details
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-800">{moment(viewingAccount.date).format("DD-MM-YYYY")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="text-sm font-medium text-gray-800">{viewingAccount.dueDate ? moment(viewingAccount.dueDate).format("DD-MM-YYYY") : "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Supplier Name</p>
                <p className="text-sm font-medium text-gray-800">{viewingAccount.supplierName}</p>
              </div>

              {viewingAccount.supplierPhone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-600">{viewingAccount.supplierPhone}</p>
                </div>
              )}

              {viewingAccount.supplierAddress && (
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-600">{viewingAccount.supplierAddress}</p>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-bold text-blue-600">৳{viewingAccount.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="text-sm font-bold text-green-600">৳{viewingAccount.paidAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Remaining</p>
                    <p className="text-sm font-bold text-red-600">৳{viewingAccount.remainingAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusColors[viewingAccount.status]}`}>
                  {viewingAccount.status.toUpperCase()}
                </span>
              </div>

              {viewingAccount.remarks && (
                <div>
                  <p className="text-xs text-gray-500">Remarks</p>
                  <p className="text-sm text-gray-600">{viewingAccount.remarks}</p>
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && editingAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaCreditCard /> Record Payment
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Supplier: <span className="font-semibold">{editingAccount.supplierName}</span></p>
                <p className="text-sm text-gray-600">Total Amount: <span className="font-semibold">৳{editingAccount.amount.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600">Already Paid: <span className="font-semibold text-green-600">৳{editingAccount.paidAmount.toLocaleString()}</span></p>
                <p className="text-sm text-gray-600">Remaining: <span className="font-semibold text-red-600">৳{editingAccount.remainingAmount.toLocaleString()}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  max={editingAccount.remainingAmount}
                  step="0.01"
                  className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Max: ৳{editingAccount.remainingAmount.toLocaleString()}</p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayment}
                  disabled={paymentProcessing || !paymentAmount}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <><FaSpinner className="animate-spin" /> Processing...</>
                  ) : (
                    <><FaSave /> Record Payment</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;