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
  FaBox,
  FaBoxOpen,
  FaTag,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  console.log(filteredInventory);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [productStatus, setProductStatus] = useState("");
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
    uploadedToProduct: 0,
    notUploaded: 0,
  });

  // Fetch categories
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  // Fetch inventory on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [
    searchTerm,
    selectedCategory,
    stockStatus,
    productStatus,
    inventory,
    products,
  ]);

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

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/v1/products?limit=1000");
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/inventory`);
      const data = await response.json();

      if (data.success) {
        // Use the API's matching results directly - DON'T re-match on client
        console.log("📊 API Stats:", data.stats);
        console.log("📊 Sample item:", data.inventory[0]);

        // The API already provides isLinkedToProduct flag
        setInventory(data.inventory);
        calculateStats(data.inventory);

        // Update stats from API response for accuracy
        if (data.stats) {
          setStats((prev) => ({
            ...prev,
            uploadedToProduct: data.stats.uploaded,
            notUploaded: data.stats.notUploaded,
            totalProducts: data.stats.total,
          }));
        }
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

  const calculateStats = (items) => {
    const outOfStock = items.filter((item) => item.currentQty === 0).length;
    const lowStock = items.filter(
      (item) => item.currentQty > 0 && item.currentQty <= 10,
    ).length;
    const inStock = items.filter((item) => item.currentQty > 0).length;
    const uploadedToProduct = items.filter(
      (item) => item.isLinkedToProduct,
    ).length;
    const notUploaded = items.filter((item) => !item.isLinkedToProduct).length;

    setStats({
      totalProducts: items.length,
      lowStock,
      outOfStock,
      inStock,
      uploadedToProduct,
      notUploaded,
    });
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

    if (productStatus === "uploaded") {
      filtered = filtered.filter((item) => item.isLinkedToProduct);
    } else if (productStatus === "not_uploaded") {
      filtered = filtered.filter((item) => !item.isLinkedToProduct);
    }

    setFilteredInventory(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setStockStatus("");
    setProductStatus("");
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormData({
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
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      date: new Date(item.date).toISOString().split("T")[0],
      productName: item.productName,
      category: item.categoryId || item.category?._id || "",
      supplier: item.supplier || "",
      barcode: item.barcode || "",
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

      const submitData = { ...formData };
      if (!editingItem && (!submitData.barcode || submitData.barcode === "")) {
        submitData.barcode = "";
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

  const handlePrintAll = () => {
    printInventory(filteredInventory, "Complete Inventory Report");
  };

  const handlePrintNotUploaded = () => {
    const notUploadedItems = filteredInventory.filter(
      (item) => !item.isLinkedToProduct,
    );
    if (notUploadedItems.length === 0) {
      toast.error("No items found that are not uploaded as products");
      return;
    }
    printInventory(
      notUploadedItems,
      "Not Uploaded as Product - Inventory Report",
    );
  };

  const printInventory = (items, title) => {
    const printWindow = window.open("", "_blank");
    const inStockItems = items.filter((item) => item.currentQty > 0);
    const outOfStockItems = items.filter((item) => item.currentQty === 0);
    const uploadedCount = items.filter((item) => item.isLinkedToProduct).length;
    const notUploadedCount = items.filter(
      (item) => !item.isLinkedToProduct,
    ).length;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
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
            .product-badge {
              background-color: #22c55e;
              color: white;
              padding: 2px 6px;
              border-radius: 12px;
              font-size: 10px;
              display: inline-block;
            }
            .no-product-badge {
              background-color: #ef4444;
              color: white;
              padding: 2px 6px;
              border-radius: 12px;
              font-size: 10px;
              display: inline-block;
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
          <div class="header">
            <h1>${title}</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Total Items: ${items.length} | In Stock: ${inStockItems.length} | Out of Stock: ${outOfStockItems.length}</p>
            <p>Uploaded as Product: ${uploadedCount} | Not Uploaded: ${notUploadedCount}</p>
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
                <th>Product Status</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              ${items
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
                  <td>
                    ${
                      item.isLinkedToProduct
                        ? '<span class="product-badge">✓ Uploaded</span>'
                        : '<span class="no-product-badge">✗ Not Uploaded</span>'
                    }
                  </td>
                  <td>${item.currentQty === 0 ? "Out of Stock" : item.currentQty <= 10 ? "Low Stock" : "In Stock"}</td>
                </tr>
              `,
                )
                .join("")}
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(150vh)] md:h-[calc(120vh)]">
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
              onClick={handlePrintNotUploaded}
              className="bg-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
              title="Print items not uploaded as products"
            >
              <FaBoxOpen className="text-xs sm:text-sm" /> Print Not Uploaded
            </button>
            <button
              onClick={handlePrintAll}
              className="bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPrint className="text-xs sm:text-sm" /> Print All
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaWarehouse className="text-blue-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            {stats.totalProducts}
          </p>
          <p className="text-xs text-gray-500">Total Items</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaExclamationTriangle className="text-yellow-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-yellow-600">{stats.lowStock}</p>
          <p className="text-xs text-gray-500">Low Stock</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaExclamationTriangle className="text-red-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-red-600">{stats.outOfStock}</p>
          <p className="text-xs text-gray-500">Out of Stock</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaCheckCircle className="text-green-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-green-600">{stats.inStock}</p>
          <p className="text-xs text-gray-500">In Stock</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaTag className="text-green-600 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-green-600">
            {stats.uploadedToProduct}
          </p>
          <p className="text-xs text-gray-500">Uploaded to Products</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaBoxOpen className="text-orange-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-orange-600">
            {stats.notUploaded}
          </p>
          <p className="text-xs text-gray-500">Not Uploaded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 flex-shrink-0 border-b border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by product name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="sm:w-48 relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 appearance-none bg-white"
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
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">All Stock</option>
              <option value="in">In Stock (Qty &gt; 0)</option>
              <option value="low">Low Stock (1-10)</option>
              <option value="out">Out of Stock (Qty = 0)</option>
            </select>
          </div>

          <div className="sm:w-48">
            <select
              value={productStatus}
              onChange={(e) => setProductStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">All Products</option>
              <option value="uploaded">Uploaded as Product</option>
              <option value="not_uploaded">Not Uploaded</option>
            </select>
          </div>

          {(searchTerm || selectedCategory || stockStatus || productStatus) && (
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
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Date
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Product
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Barcode
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500">
                  Category
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Initial
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Current
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Purchase
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Sale
                </th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500">
                  Profit
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Product Status
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Stock
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                    </div>
                    <p className="text-gray-500 mt-2">Loading inventory...</p>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-12 text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item.currentQty);
                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-gray-50 transition-colors ${!item.isLinkedToProduct ? "bg-orange-50/30" : ""}`}
                    >
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-600">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-800">
                        {item.productName}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <span>{item.barcode || "-"}</span>
                          {item.barcode && (
                            <button
                              onClick={() =>
                                copyToClipboard(item.barcode, item.productName)
                              }
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
                      <td className="px-3 sm:px-4 py-3 text-center text-xs text-gray-600">
                        {item.initialQty}
                      </td>
                      <td
                        className={`px-3 sm:px-4 py-3 text-center text-xs font-semibold ${item.currentQty === 0 ? "text-red-600" : item.currentQty <= 10 ? "text-yellow-600" : "text-green-600"}`}
                      >
                        {item.currentQty}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-blue-600">
                        ৳{item.purchaseRate}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-blue-600">
                        ৳{item.saleRate}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-right text-xs text-green-600 font-semibold">
                        ৳{item.profitPerProduct}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center">
                        {item.isLinkedToProduct ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            <FaCheckCircle className="text-xs" /> Uploaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                            <FaBoxOpen className="text-xs" /> Not Uploaded
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${status.bgColor} ${status.textColor}`}
                        >
                          {status.text}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex gap-2 justify-center">
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
                })
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg"
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
                    placeholder={
                      !editingItem ? "Will be auto-generated" : "Enter barcode"
                    }
                    className={`w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg ${!editingItem ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg"
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
                    className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-lg"
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
                        Number(formData.purchaseRate || 0) +
                        Number(formData.CPP || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Profit per Product:</span>
                    <span className="ml-2 font-semibold text-green-600">
                      ৳
                      {(
                        Number(formData.saleRate || 0) -
                        (Number(formData.purchaseRate || 0) +
                          Number(formData.CPP || 0))
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
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 disabled:opacity-50"
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
