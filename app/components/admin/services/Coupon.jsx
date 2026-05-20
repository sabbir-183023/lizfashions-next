// app/components/admin/services/Coupon.jsx
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
  FaTag,
  FaUsers,
  FaPhone,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import toast from "react-hot-toast";
import moment from "moment";

const Coupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adding, setAdding] = useState(false);

  // Add form state
  const [addFormData, setAddFormData] = useState({
    validityStart: new Date().toISOString().split("T")[0],
    validityEnd: "",
    couponCode: "",
    couponQty: "",
    discountAmount: "",
    dedicatedUserPhone: "",
    remarks: "",
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    validityStart: "",
    validityEnd: "",
    couponCode: "",
    couponQty: "",
    discountAmount: "",
    dedicatedUserPhone: "",
    isAvtive: true,
    remarks: "",
  });

  // Fetch coupons
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/v1/admin/coupons?limit=500";
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setCoupons(data.coupons);
        setFilteredCoupons(data.coupons);
      } else {
        toast.error(data.message || "Failed to fetch coupons");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Apply search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = coupons.filter(
        (coupon) =>
          coupon.couponCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.dedicatedUserPhone?.includes(searchTerm) ||
          coupon.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCoupons(filtered);
    } else {
      setFilteredCoupons(coupons);
    }
  }, [searchTerm, coupons]);

  const handleClearFilters = () => {
    setSearchTerm("");
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

  const handleAddCoupon = async () => {
    if (!addFormData.validityStart || !addFormData.validityEnd || !addFormData.couponCode || !addFormData.couponQty || !addFormData.discountAmount) {
      toast.error("All required fields must be filled");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/v1/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addFormData),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Coupon created successfully");
        setAddFormData({
          validityStart: new Date().toISOString().split("T")[0],
          validityEnd: "",
          couponCode: "",
          couponQty: "",
          discountAmount: "",
          dedicatedUserPhone: "",
          remarks: "",
        });
        setIsAddModalOpen(false);
        fetchCoupons();
      } else {
        toast.error(data.message || "Failed to create coupon");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error("Failed to create coupon");
    } finally {
      setAdding(false);
    }
  };

  const handleEditClick = (coupon) => {
    setEditingCoupon(coupon);
    setEditFormData({
      validityStart: moment(coupon.validityStart).format("YYYY-MM-DD"),
      validityEnd: moment(coupon.validityEnd).format("YYYY-MM-DD"),
      couponCode: coupon.couponCode,
      couponQty: coupon.couponQty,
      discountAmount: coupon.discountAmount,
      dedicatedUserPhone: coupon.dedicatedUserPhone || "",
      isAvtive: coupon.isAvtive,
      remarks: coupon.remarks || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCoupon = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/v1/admin/coupons/${editingCoupon._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await response.json();

      if (data.success) {
        const updatedCoupons = coupons.map((coupon) =>
          coupon._id === editingCoupon._id ? data.coupon : coupon
        );
        setCoupons(updatedCoupons);
        setFilteredCoupons(
          searchTerm
            ? updatedCoupons.filter(
                (c) =>
                  c.couponCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.dedicatedUserPhone?.includes(searchTerm)
              )
            : updatedCoupons
        );
        toast.success("Coupon updated successfully");
        setIsEditModalOpen(false);
      } else {
        toast.error(data.message || "Failed to update coupon");
      }
    } catch (error) {
      console.error("Error updating coupon:", error);
      toast.error("Failed to update coupon");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = async (couponId, couponCode) => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) {
      return;
    }

    setDeletingId(couponId);
    try {
      const response = await fetch(`/api/v1/admin/coupons/${couponId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        const updatedCoupons = coupons.filter((coupon) => coupon._id !== couponId);
        setCoupons(updatedCoupons);
        setFilteredCoupons(
          searchTerm
            ? updatedCoupons.filter(
                (c) =>
                  c.couponCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.dedicatedUserPhone?.includes(searchTerm)
              )
            : updatedCoupons
        );
        toast.success("Coupon deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    const endDate = new Date(coupon.validityEnd);
    const startDate = new Date(coupon.validityStart);
    
    if (!coupon.isAvtive) {
      return { text: "INACTIVE", color: "bg-gray-100 text-gray-700" };
    }
    if (now > endDate) {
      return { text: "EXPIRED", color: "bg-red-100 text-red-700" };
    }
    if (now < startDate) {
      return { text: "UPCOMING", color: "bg-blue-100 text-blue-700" };
    }
    if (coupon.couponQty <= 0) {
      return { text: "USED UP", color: "bg-orange-100 text-orange-700" };
    }
    return { text: "ACTIVE", color: "bg-green-100 text-green-700" };
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printDate = new Date().toLocaleString();

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Coupons Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; background: white; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { color: #1e3a8a; margin: 0; }
            .header p { margin: 5px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { border: 1px solid #000; padding: 10px 8px; text-align: left; background-color: #f2f2f2; font-weight: bold; }
            td { border: 1px solid #000; padding: 8px; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Coupons Report</h1>
            <p>Generated on: ${printDate}</p>
            <p>Total Records: ${filteredCoupons.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Valid From</th>
                <th>Valid To</th>
                <th>Quantity</th>
                <th>Discount</th>
                <th>Dedicated User</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCoupons
                .map(
                  (coupon) => `
              <tr>
                <td>${coupon.couponCode}</td>
                <td>${moment(coupon.validityStart).format("DD-MM-YYYY")}</td>
                <td>${moment(coupon.validityEnd).format("DD-MM-YYYY")}</td>
                <td class="text-center">${coupon.couponQty}</td>
                <td class="text-right">৳${coupon.discountAmount.toLocaleString()}</td>
                <td>${coupon.dedicatedUserPhone || "All Users"}</td>
                <td class="text-center">${getStatusBadge(coupon).text}</td>
                <td>${coupon.remarks || "-"}</td>
              </tr>
            `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Coupon Management System</p>
          </div>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 1000); };
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
  const currentCoupons = filteredCoupons.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(129vh)] md:h-[calc(90vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaTag /> Coupon Management
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Create and manage discount coupons
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-yellow-400 text-blue-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPlus /> Create Coupon
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
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Coupons</p>
          <p className="text-lg font-bold text-gray-800">{filteredCoupons.length}</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-lg font-bold text-green-600">
            {filteredCoupons.filter(c => getStatusBadge(c).text === "ACTIVE").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Expired</p>
          <p className="text-lg font-bold text-red-600">
            {filteredCoupons.filter(c => getStatusBadge(c).text === "EXPIRED").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Used Up</p>
          <p className="text-lg font-bold text-orange-600">
            {filteredCoupons.filter(c => getStatusBadge(c).text === "USED UP").length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">For Specific Users</p>
          <p className="text-lg font-bold text-purple-600">
            {filteredCoupons.filter(c => c.dedicatedUserPhone).length}
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
              placeholder="Search by coupon code, phone, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaTimes className="inline mr-1" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Coupons Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid From</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid To</th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dedicated User</th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
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
                    <p className="text-gray-500 mt-2">Loading coupons...</p>
                  </td>
                </tr>
              ) : currentCoupons.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-500">
                    No coupons found
                  </td>
                </tr>
              ) : (
                currentCoupons.map((coupon) => {
                  const status = getStatusBadge(coupon);
                  const now = new Date();
                  const endDate = new Date(coupon.validityEnd);
                  const isExpiringSoon = endDate - now < 7 * 24 * 60 * 60 * 1000 && endDate > now;
                  
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-4 py-3">
                        <span className="font-mono font-semibold text-gray-800">{coupon.couponCode}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                        {moment(coupon.validityStart).format("DD-MM-YYYY")}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                        {moment(coupon.validityEnd).format("DD-MM-YYYY")}
                        {isExpiringSoon && <span className="ml-2 text-xs text-orange-500">(Expiring soon!)</span>}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center text-sm font-medium text-gray-700">
                        {coupon.couponQty}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-sm font-semibold text-green-600">
                        ৳{coupon.discountAmount?.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-500">
                        {coupon.dedicatedUserPhone ? (
                          <span className="flex items-center gap-1">
                            <FaPhone className="text-xs" /> {coupon.dedicatedUserPhone}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaUsers className="text-xs" /> All Users
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">
                        {coupon.remarks || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditClick(coupon)}
                            disabled={deletingId === coupon._id}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 disabled:opacity-50"
                            title="Edit"
                          >
                            <FaEdit className="text-xs sm:text-sm" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(coupon._id, coupon.couponCode)}
                            disabled={deletingId === coupon._id}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === coupon._id ? (
                              <FaSpinner className="animate-spin text-xs" />
                            ) : (
                              <FaTrash className="text-xs sm:text-sm" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCoupons.length)} of {filteredCoupons.length} coupons
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

      {/* Add Coupon Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaPlus /> Create New Coupon
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleAddCoupon(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="couponCode"
                    value={addFormData.couponCode}
                    onChange={handleAddInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 uppercase"
                    placeholder="e.g., SAVE20, WELCOME10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="validityStart"
                      value={addFormData.validityStart}
                      onChange={handleAddInputChange}
                      required
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="validityEnd"
                      value={addFormData.validityEnd}
                      onChange={handleAddInputChange}
                      required
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="couponQty"
                      value={addFormData.couponQty}
                      onChange={handleAddInputChange}
                      required
                      min="1"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                      placeholder="Number of uses"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Amount (৳) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="discountAmount"
                      value={addFormData.discountAmount}
                      onChange={handleAddInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                      placeholder="Fixed discount"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dedicated User Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="dedicatedUserPhone"
                    value={addFormData.dedicatedUserPhone}
                    onChange={handleAddInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="01XXXXXXXXX (Leave empty for all users)"
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
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {adding ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaSave /> Create Coupon</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {isEditModalOpen && editingCoupon && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaEdit /> Edit Coupon
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateCoupon(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="couponCode"
                    value={editFormData.couponCode}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="validityStart"
                      value={editFormData.validityStart}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="validityEnd"
                      value={editFormData.validityEnd}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="couponQty"
                      value={editFormData.couponQty}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount Amount (৳) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="discountAmount"
                      value={editFormData.discountAmount}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dedicated User Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="dedicatedUserPhone"
                    value={editFormData.dedicatedUserPhone}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isAvtive"
                      checked={editFormData.isAvtive}
                      onChange={(e) => setEditFormData({ ...editFormData, isAvtive: e.target.checked })}
                      className="w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
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
    </div>
  );
};

export default Coupon;