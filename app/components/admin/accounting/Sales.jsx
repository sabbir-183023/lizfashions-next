// app/components/admin/accounting/Sales.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaPrint,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaSpinner,
  FaSave,
  FaPlus,
  FaCalendarAlt,
  FaDownload,
} from "react-icons/fa";
import toast from "react-hot-toast";
import moment from "moment";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSale, setEditingSale] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [totalSales, setTotalSales] = useState(0);
  const [totals, setTotals] = useState({
    totalPurchasePrice: 0,
    totalSellPrice: 0,
    totalProfit: 0,
    totalDiscount: 0,
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    productName: "",
    purchasePrice: "",
    CPP: "",
    totalDiscount: "",
    sellPrice: "",
    profit: "",
    remarks: "",
  });

  // Fetch sales data
  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/v1/admin/sales?limit=500";
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSales(data.sales);
        setFilteredSales(data.sales);
        setTotalSales(data.total);
        calculateTotals(data.sales);
      } else {
        toast.error(data.message || "Failed to fetch sales");
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Apply search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = sales.filter(
        (sale) =>
          sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.remarks?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredSales(filtered);
      calculateTotals(filtered);
    } else {
      setFilteredSales(sales);
      calculateTotals(sales);
    }
  }, [searchTerm, sales]);

  const calculateTotals = (salesData) => {
    const totals = salesData.reduce(
      (acc, sale) => {
        acc.totalPurchasePrice += sale.purchasePrice || 0;
        acc.totalSellPrice += sale.sellPrice || 0;
        acc.totalProfit += sale.profit || 0;
        acc.totalDiscount += sale.totalDiscount || 0;
        return acc;
      },
      {
        totalPurchasePrice: 0,
        totalSellPrice: 0,
        totalProfit: 0,
        totalDiscount: 0,
      },
    );
    setTotals(totals);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleEditClick = (sale) => {
    setEditingSale(sale);
    setEditFormData({
      productName: sale.productName,
      purchasePrice: sale.purchasePrice,
      CPP: sale.CPP,
      totalDiscount: sale.totalDiscount,
      sellPrice: sale.sellPrice,
      profit: sale.profit,
      remarks: sale.remarks || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSale = async () => {
    try {
      const response = await fetch(`/api/v1/admin/sales/${editingSale._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editFormData,
          purchasePrice: parseFloat(editFormData.purchasePrice),
          CPP: parseFloat(editFormData.CPP),
          totalDiscount: parseFloat(editFormData.totalDiscount),
          sellPrice: parseFloat(editFormData.sellPrice),
          profit: parseFloat(editFormData.profit),
        }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Sale record updated successfully");
        setIsEditModalOpen(false);
        fetchSales();
      } else {
        toast.error(data.message || "Failed to update sale");
      }
    } catch (error) {
      console.error("Error updating sale:", error);
      toast.error("Failed to update sale");
    }
  };

  const handleDeleteClick = async (saleId, productName) => {
    if (
      confirm(
        `Are you sure you want to delete sale record for "${productName}"?`,
      )
    ) {
      try {
        const response = await fetch(`/api/v1/admin/sales/${saleId}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
          toast.success("Sale record deleted successfully");
          fetchSales();
        } else {
          toast.error(data.message || "Failed to delete sale");
        }
      } catch (error) {
        console.error("Error deleting sale:", error);
        toast.error("Failed to delete sale");
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const printDate = new Date().toLocaleString();

    const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sales Report</title>
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
          <h1>Sales Report</h1>
          <p>Generated on: ${printDate}</p>
          ${startDate && endDate ? `<p>Period: ${startDate} to ${endDate}</p>` : ""}
          <p>Total Records: ${filteredSales.length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product Name</th>
              <th class="text-right">Purchase Price</th>
              <th class="text-right">CPP</th>
              <th class="text-right">Sell Price</th>
              <th class="text-right">Discount</th>
              <th class="text-right">Profit</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSales
              .map(
                (sale) => `
              </tr>
                <td>${moment(sale.date).format("DD-MM-YYYY")}</td>
                <td>${sale.productName}</td>
                <td class="text-right">৳${sale.purchasePrice.toLocaleString()}</td>
                <td class="text-right">৳${sale.CPP.toLocaleString()}</td>
                <td class="text-right">৳${sale.sellPrice.toLocaleString()}</td>
                <td class="text-right">৳${sale.totalDiscount.toLocaleString()}</td>
                <td class="text-right">৳${sale.profit.toLocaleString()}</td>
                <td>${sale.remarks || "-"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr class="totals-row">
              <td colspan="2"><strong>Totals</strong></td>
              <td class="text-right"><strong>৳${totals.totalPurchasePrice.toLocaleString()}</strong></td>
              <td class="text-right"><strong>৳${totals.totalCPP?.toLocaleString() || "0"}</strong></td>
              <td class="text-right"><strong>৳${totals.totalSellPrice.toLocaleString()}</strong></td>
              <td class="text-right"><strong>৳${totals.totalDiscount.toLocaleString()}</strong></td>
              <td class="text-right"><strong>৳${totals.totalProfit.toLocaleString()}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="footer">
          <p>Generated by Inventory Management System</p>
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
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const getProfitColor = (profit) => {
    if (profit > 0) return "text-green-600";
    if (profit < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(129vh)] md:h-[calc(90vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaCalendarAlt /> Sales Records
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Manage and track all sales transactions
            </p>
          </div>
          <div className="flex gap-2">
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Sales</p>
          <p className="text-lg font-bold text-gray-800">
            {filteredSales.length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Purchase</p>
          <p className="text-lg font-bold text-blue-600">
            ৳{totals.totalPurchasePrice.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-lg font-bold text-green-600">
            ৳{totals.totalSellPrice.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-xs text-gray-500">Total Profit</p>
          <p className="text-lg font-bold text-green-700">
            ৳{totals.totalProfit.toLocaleString()}
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
              placeholder="Search by product name or remarks..."
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

      {/* Sales Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Date
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Product
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Purchase
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  CPP
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Sell Price
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Discount
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Profit
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Remarks
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <FaSpinner className="animate-spin text-3xl text-yellow-500" />
                    </div>
                    <p className="text-gray-500 mt-2">
                      Loading sales records...
                    </p>
                  </td>
                </tr>
              ) : currentSales.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-gray-500">
                    No sales records found
                  </td>
                </tr>
              ) : (
                <>
                  {currentSales.map((sale) => (
                    <tr
                      key={sale._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                        {moment(sale.date).format("DD-MM-YYYY")}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-800">
                        {sale.productName}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-blue-600">
                        ৳{sale.purchasePrice?.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-purple-600">
                        ৳{sale.CPP?.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-green-600 font-semibold">
                        ৳{sale.sellPrice?.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-red-600">
                        ৳{sale.totalDiscount?.toLocaleString()}
                      </td>
                      <td
                        className={`px-3 sm:px-4 py-3 text-right text-xs font-semibold ${getProfitColor(sale.profit)}`}
                      >
                        ৳{sale.profit?.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">
                        {sale.remarks || "-"}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditClick(sale)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="Edit"
                          >
                            <FaEdit className="text-xs sm:text-sm" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteClick(sale._id, sale.productName)
                            }
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Delete"
                          >
                            <FaTrash className="text-xs sm:text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
            <tfoot className="bg-gray-100 sticky bottom-0">
              <tr>
                <td
                  colSpan="2"
                  className="px-3 sm:px-4 py-3 text-sm font-bold text-gray-800"
                >
                  Totals
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-blue-700">
                  ৳{totals.totalPurchasePrice.toLocaleString()}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-purple-700">
                  ৳{totals.totalCPP?.toLocaleString() || "0"}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-green-700">
                  ৳{totals.totalSellPrice.toLocaleString()}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-red-700">
                  ৳{totals.totalDiscount.toLocaleString()}
                </td>
                <td className="px-3 sm:px-4 py-3 text-right text-sm font-bold text-green-700">
                  ৳{totals.totalProfit.toLocaleString()}
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
              {Math.min(indexOfLastItem, filteredSales.length)} of{" "}
              {filteredSales.length} sales
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

      {/* Edit Modal */}
      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Sale Record</h2>
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
                  handleUpdateSale();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={editFormData.productName}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purchase Price
                    </label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={editFormData.purchasePrice}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPP (Cost Per Product)
                    </label>
                    <input
                      type="number"
                      name="CPP"
                      value={editFormData.CPP}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sell Price
                    </label>
                    <input
                      type="number"
                      name="sellPrice"
                      value={editFormData.sellPrice}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      name="totalDiscount"
                      value={editFormData.totalDiscount}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profit
                    </label>
                    <input
                      type="number"
                      name="profit"
                      value={editFormData.profit}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={editFormData.remarks}
                      onChange={handleEditInputChange}
                      rows="2"
                      className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
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
                    className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2"
                  >
                    <FaSave /> Update Sale
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

export default Sales;
