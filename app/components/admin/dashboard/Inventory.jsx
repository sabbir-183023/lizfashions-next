// app/admin/dashboard/components/Inventory.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaWarehouse,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaPrint,
  FaTimes,
  FaSave,
  FaCopy,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    productName: "",
    category: "",
    supplier: "",
    barcode: "",
    initialQty: 0,
    currentQty: 0,
    purchaseRate: 0,
    CPP: 0,
    saleRate: 0,
  });

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    inStock: 0,
  });

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch inventory on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, stockStatus, inventory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/v1/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/inventory`);
      const data = await response.json();

      if (data.success) {
        setInventory(data.inventory);
        calculateStats(data.inventory);
      } else {
        toast.error(data.message || "Failed to fetch inventory");
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...inventory];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.barcode &&
            item.barcode.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.categoryId === selectedCategory,
      );
    }

    if (stockStatus === "out") {
      filtered = filtered.filter((item) => item.currentQty === 0);
    } else if (stockStatus === "low") {
      filtered = filtered.filter(
        (item) => item.currentQty > 0 && item.currentQty <= 10,
      );
    } else if (stockStatus === "in") {
      filtered = filtered.filter((item) => item.currentQty > 0);
    }

    setFilteredInventory(filtered);
  };

  const calculateStats = (items) => {
    const outOfStock = items.filter((item) => item.currentQty === 0).length;
    const lowStock = items.filter(
      (item) => item.currentQty > 0 && item.currentQty <= 10,
    ).length;
    const inStock = items.filter((item) => item.currentQty > 0).length;

    setStats({
      totalProducts: items.length,
      lowStock,
      outOfStock,
      inStock,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setStockStatus("");
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      productName: "",
      category: "",
      supplier: "",
      barcode: "", // Blank for new products
      initialQty: 0,
      currentQty: 0,
      purchaseRate: 0,
      CPP: 0,
      saleRate: 0,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      date: new Date(item.date).toISOString().split("T")[0],
      productName: item.productName,
      category: item.categoryId || item.category?._id || "",
      supplier: item.supplier || "",
      barcode: item.barcode || "", // Show existing barcode for editing
      initialQty: item.initialQty,
      currentQty: item.currentQty,
      purchaseRate: item.purchaseRate,
      CPP: item.CPP,
      saleRate: item.saleRate,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id, productName) => {
    if (confirm(`Are you sure you want to delete ${productName}?`)) {
      try {
        const response = await fetch(`/api/v1/admin/inventory/${id}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
          toast.success("Inventory deleted successfully");
          fetchInventory();
        } else {
          toast.error(data.message || "Failed to delete inventory");
        }
      } catch (error) {
        console.error("Error deleting inventory:", error);
        toast.error("Failed to delete inventory");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const url = editingItem
        ? `/api/v1/admin/inventory/${editingItem._id}`
        : "/api/v1/admin/inventory";

      const method = editingItem ? "PUT" : "POST";

      // For new products, send empty barcode to trigger auto-generation
      const submitData = { ...formData };
      if (!editingItem && (!submitData.barcode || submitData.barcode === "")) {
        submitData.barcode = ""; // Send empty to trigger auto-generation on server
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingItem
            ? "Inventory updated successfully"
            : "Inventory added successfully",
        );
        setIsModalOpen(false);
        fetchInventory();
      } else {
        toast.error(data.message || "Failed to save inventory");
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
      toast.error("Failed to save inventory");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Copy barcode to clipboard
  const copyToClipboard = async (barcode, productName) => {
    if (!barcode || barcode === "-") {
      toast.error("No barcode to copy");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(barcode);
      toast.success(`Barcode ${barcode} copied for ${productName}`);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy barcode");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const inStockItems = filteredInventory.filter(
      (item) => item.currentQty > 0,
    );
    const outOfStockItems = filteredInventory.filter(
      (item) => item.currentQty === 0,
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              margin: 0;
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
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .section-title {
              background-color: #e5e7eb;
              font-weight: bold;
              font-size: 14px;
            }
            .text-green {
              color: #16a34a;
            }
            .text-red {
              color: #dc2626;
            }
            .text-blue {
              color: #2563eb;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            /* Hide copy buttons in print */
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Report</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Total Items: ${filteredInventory.length} | In Stock: ${inStockItems.length} | Out of Stock: ${outOfStockItems.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product Name</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Initial Qty</th>
                <th>Current Qty</th>
                <th>Purchase Rate</th>
                <th>Sale Rate</th>
                <th>Profit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${inStockItems
                .map(
                  (item) => `
                <tr>
                  <td>${new Date(item.date).toLocaleDateString()}</td>
                  <td>${item.productName}</td>
                  <td>${item.barcode || "-"}</td>
                  <td>${item.categoryName}</td>
                  <td>${item.initialQty}</td>
                  <td>${item.currentQty}</td>
                  <td>৳${item.purchaseRate}</td>
                  <td>৳${item.saleRate}</td>
                  <td class="text-green">৳${item.profitPerProduct}</td>
                  <td>${item.currentQty <= 10 ? "Low Stock" : "In Stock"}</td>
                </tr>
              `,
                )
                .join("")}
              
              ${
                outOfStockItems.length > 0
                  ? `
                <tr class="section-title">
                  <td colspan="10" style="background-color: #fee2e2; color: #dc2626;">Out of Stock Items</td>
                </tr>
                ${outOfStockItems
                  .map(
                    (item) => `
                  <tr>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td>${item.productName}</td>
                    <td>${item.barcode || "-"}</td>
                    <td>${item.categoryName}</td>
                    <td>${item.initialQty}</td>
                    <td class="text-red">${item.currentQty}</td>
                    <td>৳${item.purchaseRate}</td>
                    <td>৳${item.saleRate}</td>
                    <td class="text-green">৳${item.profitPerProduct}</td>
                    <td class="text-red">Out of Stock</td>
                  </tr>
                `,
                  )
                  .join("")}
              `
                  : ""
              }
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Inventory Management System</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const numericFields = [
      "initialQty",
      "currentQty",
      "purchaseRate",
      "CPP",
      "saleRate",
    ];

    if (numericFields.includes(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0)
      return {
        text: "Out of Stock",
        color: "red",
        bgColor: "bg-red-100",
        textColor: "text-red-700",
      };
    if (quantity <= 10)
      return {
        text: "Low Stock",
        color: "yellow",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-700",
      };
    return {
      text: "In Stock",
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    };
  };

  const outOfStockItems = filteredInventory.filter(
    (item) => item.currentQty === 0,
  );
  const inStockItems = filteredInventory.filter((item) => item.currentQty > 0);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(120vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Inventory Management
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Track and manage your stock levels
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPrint className="text-xs sm:text-sm" /> Print
            </button>
            <button
              onClick={handleAddClick}
              className="bg-yellow-400 text-blue-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPlus className="text-xs sm:text-sm" /> Add Inventory
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm">
          <FaWarehouse className="text-blue-500 text-xl sm:text-2xl mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {stats.totalProducts}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm">Total Items</p>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm">
          <FaExclamationTriangle className="text-yellow-500 text-xl sm:text-2xl mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">
            {stats.lowStock}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm">Low Stock</p>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm">
          <FaExclamationTriangle className="text-red-500 text-xl sm:text-2xl mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-red-600">
            {stats.outOfStock}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm">Out of Stock</p>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm">
          <FaCheckCircle className="text-green-500 text-xl sm:text-2xl mx-auto mb-2" />
          <p className="text-xl sm:text-2xl font-bold text-green-600">
            {stats.inStock}
          </p>
          <p className="text-gray-600 text-xs sm:text-sm">In Stock</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 flex-shrink-0 border-b border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by product name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          <div className="sm:w-48 relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent appearance-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-40">
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="">All Stock</option>
              <option value="in">In Stock (Qty &gt; 0)</option>
              <option value="low">Low Stock (1-10)</option>
              <option value="out">Out of Stock (Qty = 0)</option>
            </select>
          </div>

          {(searchTerm || selectedCategory || stockStatus) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          Showing {filteredInventory.length} of {inventory.length} inventory
          items
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Initial
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                    </div>
                    <p className="text-gray-500 mt-2">Loading inventory...</p>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-12 text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                <>
                  {inStockItems.map((item) => {
                    const status = getStockStatus(item.currentQty);
                    return (
                      <tr
                        key={item._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs font-medium text-gray-800">
                          {item.productName}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>{item.barcode || "-"}</span>
                            {item.barcode && (
                              <button
                                onClick={() => copyToClipboard(item.barcode, item.productName)}
                                className="text-gray-400 hover:text-blue-600 transition-colors no-print"
                                title="Copy barcode"
                              >
                                <FaCopy className="text-xs" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                          {item.categoryName}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                          {item.initialQty}
                        </td>
                        <td
                          className={`px-3 sm:px-4 py-3 text-xs font-semibold ${item.currentQty <= 10 ? "text-yellow-600" : "text-green-600"}`}
                        >
                          {item.currentQty}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-blue-600">
                          ৳{item.purchaseRate}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-blue-600">
                          ৳{item.saleRate}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-green-600 font-semibold">
                          ৳{item.profitPerProduct}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${status.bgColor} ${status.textColor}`}
                          >
                            {status.text}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                              title="Edit"
                            >
                              <FaEdit className="text-xs sm:text-sm" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClick(item._id, item.productName)
                              }
                              className="text-red-600 hover:text-red-800 p-1 transition-colors"
                              title="Delete"
                            >
                              <FaTrash className="text-xs sm:text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {outOfStockItems.length > 0 && (
                    <>
                      <tr className="bg-red-50">
                        <td
                          colSpan="11"
                          className="px-3 sm:px-4 py-3 text-sm font-bold text-red-700"
                        >
                          ⚠️ Out of Stock Items ({outOfStockItems.length})
                        </td>
                      </tr>
                      {outOfStockItems.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50 transition-colors bg-red-50/30"
                        >
                          <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs font-medium text-gray-800">
                            {item.productName}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <span>{item.barcode || "-"}</span>
                              {item.barcode && (
                                <button
                                  onClick={() => copyToClipboard(item.barcode, item.productName)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors no-print"
                                  title="Copy barcode"
                                >
                                  <FaCopy className="text-xs" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                            {item.categoryName}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                            {item.initialQty}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs font-semibold text-red-600">
                            {item.currentQty}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs text-blue-600">
                            ৳{item.purchaseRate}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs text-blue-600">
                            ৳{item.saleRate}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-xs text-green-600 font-semibold">
                            ৳{item.profitPerProduct}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                              Out of Stock
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditClick(item)}
                                className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                                title="Edit"
                              >
                                <FaEdit className="text-xs sm:text-sm" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteClick(item._id, item.productName)
                                }
                                className="text-red-600 hover:text-red-800 p-1 transition-colors"
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
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? "Edit Inventory" : "Add New Inventory"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    required
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode/SKU {!editingItem && "(Auto-generated)"}
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    readOnly={!editingItem}
                    placeholder={!editingItem ? "Will be auto-generated" : "Enter barcode"}
                    className={`w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${!editingItem ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {!editingItem && (
                    <p className="text-xs text-gray-500 mt-1">
                      A unique 7-digit barcode will be generated automatically
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Quantity *
                  </label>
                  <input
                    type="number"
                    name="initialQty"
                    value={formData.initialQty}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Quantity *
                  </label>
                  <input
                    type="number"
                    name="currentQty"
                    value={formData.currentQty}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Rate *
                  </label>
                  <input
                    type="number"
                    name="purchaseRate"
                    value={formData.purchaseRate}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPP (Cost Per Product) *
                  </label>
                  <input
                    type="number"
                    name="CPP"
                    value={formData.CPP}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Rate *
                  </label>
                  <input
                    type="number"
                    name="saleRate"
                    value={formData.saleRate}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Auto-calculated Values:
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">
                      CFP (Cost of Final Product):
                    </span>
                    <span className="ml-2 font-semibold text-blue-600">
                      ৳
                      {(
                        Number(formData.purchaseRate || 0) + Number(formData.CPP || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Profit per Product:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      ৳
                      {(
                        Number(formData.saleRate || 0) -
                        (Number(formData.purchaseRate || 0) + Number(formData.CPP || 0))
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:bg-yellow-200 disabled:text-blue-700"
                >
                  <FaSave />{" "}
                  {submitLoading
                    ? "Saving..."
                    : editingItem
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;