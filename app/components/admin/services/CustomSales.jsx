// app/components/admin/services/CustomSales.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaPrint,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaCity,
  FaShoppingCart,
  FaTruck,
  FaTag,
  FaBarcode,
  FaEye,
  FaTimes,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import { IoQrCode } from "react-icons/io5";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import Select from "react-select";
import JsBarcode from "jsbarcode";

const CustomSales = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeProducts, setBarcodeProducts] = useState([]);

  // Customer form data
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    district: "",
    policeStation: "",
    address: "",
  });

  // Order summary
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("fixed"); // fixed or percentage
  const [notes, setNotes] = useState("");

  // Fetch inventory
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/inventory");
      const data = await response.json();
      if (data.success) {
        // Only show products with currentQty > 0
        const inStockItems = data.inventory.filter(
          (item) => item.currentQty > 0,
        );
        setInventory(inStockItems);
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

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter inventory based on search
  const filteredInventory = inventory.filter(
    (item) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Add product to order
  const addToOrder = (product) => {
    const existing = selectedProducts.find((p) => p._id === product._id);
    const maxQty = product.currentQty;

    if (existing) {
      if (existing.quantity >= maxQty) {
        toast.error(`Only ${maxQty} items available in stock`);
        return;
      }
      setSelectedProducts(
        selectedProducts.map((p) =>
          p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p,
        ),
      );
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          quantity: 1,
          sellingPrice: product.saleRate,
        },
      ]);
    }
    toast.success(`${product.productName} added to order`);
  };

  // Update product quantity
  const updateQuantity = (productId, newQuantity) => {
    const product = selectedProducts.find((p) => p._id === productId);
    const maxQty = product.currentQty;

    if (newQuantity > maxQty) {
      toast.error(`Only ${maxQty} items available in stock`);
      return;
    }

    if (newQuantity < 1) {
      removeFromOrder(productId);
      return;
    }

    setSelectedProducts(
      selectedProducts.map((p) =>
        p._id === productId ? { ...p, quantity: newQuantity } : p,
      ),
    );
  };

  // Remove product from order
  const removeFromOrder = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== productId));
    toast.success("Product removed from order");
  };

  // Calculate subtotal
  const calculateSubtotal = () => {
    return selectedProducts.reduce(
      (sum, product) => sum + product.sellingPrice * product.quantity,
      0,
    );
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === "percentage") {
      return (subtotal * discount) / 100;
    }
    return discount;
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return subtotal + deliveryCharge - discountAmount;
  };

  // Handle customer form change
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
  };

  // Validate customer form (only name and phone are required for admin custom orders)
  const validateCustomerForm = () => {
    if (!customerForm.name.trim()) {
      toast.error("Customer name is required");
      return false;
    }
    if (!customerForm.phone.trim()) {
      toast.error("Customer phone is required");
      return false;
    }
    // Optional: phone validation
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(customerForm.phone)) {
      toast.error("Invalid phone number format. Use 01XXXXXXXXX");
      return false;
    }
    return true;
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!validateCustomerForm()) return;

    if (selectedProducts.length === 0) {
      toast.error("No products selected");
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        items: selectedProducts.map((p) => ({
          _id: p._id,
          name: p.productName,
          SKU: p.barcode,
          sellingPrice: p.sellingPrice,
          originalPrice: p.sellingPrice,
          selectedQuantity: p.quantity,
          photos: p.photos || [],
          slug: p.slug || p.productName.toLowerCase().replace(/\s+/g, "-"),
          maxQuantity: p.currentQty,
        })),
        customer: {
          name: customerForm.name,
          district: customerForm.district || "",
          policeStation: customerForm.policeStation || "",
          address: customerForm.address || "",
          phone: customerForm.phone,
          email: customerForm.email || "",
        },
        subtotal: calculateSubtotal(),
        deliveryCharge: deliveryCharge,
        discount: calculateDiscountAmount(),
        total: calculateGrandTotal(),
        couponCode: "",
        notes: notes,
      };

      const response = await fetch("/api/v1/admin/custom-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Custom order created successfully!");
        // Reset form
        setSelectedProducts([]);
        setCustomerForm({
          name: "",
          phone: "",
          email: "",
          district: "",
          policeStation: "",
          address: "",
        });
        setDeliveryCharge(0);
        setDiscount(0);
        setNotes("");
        // Refresh inventory
        fetchInventory();
      } else {
        toast.error(data.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  // Barcode printing functions
  const generateBarcodeImage = (barcode) => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 100;

    JsBarcode(canvas, barcode, {
      format: "CODE128",
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 16,
      fontOptions: "bold",
      textMargin: 5,
      margin: 10,
    });

    return canvas.toDataURL("image/png");
  };

  // Fixed Barcode printing function
  const handlePrintBarcodes = () => {
    if (barcodeProducts.length === 0) {
      toast.error("No products selected for barcode printing");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error("Please allow pop-ups to print barcodes");
      return;
    }

    const barcodeHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Barcode Labels</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 5px;
          }
          .barcode-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }
          .barcode-card {
            border: 1px dashed #ccc;
            padding: 5px;
            width: calc(20% - 10px);
            text-align: center;
            box-sizing: border-box;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .product-name {
            font-size: 11px;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #333;
          }
          .price {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 1px 0;
          }
          .barcode-img {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .barcode-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="barcode-grid">
          ${barcodeProducts
            .map(
              (product) => `
            ${Array.from({ length: product.quantity })
              .map(
                () => `
              <div class="barcode-card">
                <div class="product-name">${escapeHtml(product.productName)}</div>
                <div class="price">৳ ${product.saleRate}</div>
                <img class="barcode-img" src="${generateBarcodeImage(product.barcode)}" alt="Barcode" />
              </div>
            `,
              )
              .join("")}
          `,
            )
            .join("")}
        </div>
        <script>
          // Wait for all images to load before printing
          window.onload = function() {
            // Small delay to ensure everything is rendered
            setTimeout(function() {
              window.print();
              // Don't close immediately - let the user close after printing
              // The window will stay open after print dialog closes
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

    printWindow.document.write(barcodeHTML);
    printWindow.document.close();
  };

  // Helper function to escape HTML
  const escapeHtml = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const addToBarcodePrint = (product) => {
    setBarcodeProducts((prev) => {
      const existing = prev.find((p) => p._id === product._id);
      if (existing) {
        return prev.map((p) =>
          p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.productName} added to barcode print queue`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(150vh)] md:h-[calc(120vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaShoppingCart /> Custom Order
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Create custom orders for customers from inventory
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBarcodeModal(true)}
              className="bg-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaBarcode /> Print Barcodes
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Products */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search products by name or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-800">
                  Available Products
                </h3>
                <p className="text-xs text-gray-500">
                  {filteredInventory.length} products in stock
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-3xl text-yellow-500" />
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaShoppingCart className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p>No products found in inventory</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 max-h-[500px] overflow-y-auto">
                  {filteredInventory.map((product) => (
                    <div
                      key={product._id}
                      className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Product Info */}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-800">
                            {product.productName}
                          </h4>
                          {product.barcode && (
                            <p className="text-xs text-gray-400">
                              Barcode: {product.barcode}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm font-bold text-blue-600">
                              ৳ {product.saleRate}
                            </span>
                            <span className="text-xs text-gray-500">
                              Stock: {product.currentQty}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => addToOrder(product)}
                              className="flex-1 bg-yellow-400 text-blue-900 px-2 py-1 rounded text-xs font-semibold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-1"
                            >
                              <FaPlus className="text-xs" /> Add to Order
                            </button>
                            <button
                              onClick={() => addToBarcodePrint(product)}
                              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300 transition-colors flex items-center gap-1"
                              title="Add to barcode print"
                            >
                              <FaBarcode className="text-xs" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Order Summary & Customer Info */}
          <div className="space-y-6">
            {/* Selected Products */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FaShoppingCart /> Order Items ({selectedProducts.length})
                </h3>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaShoppingCart className="text-3xl mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No items added</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                  {selectedProducts.map((product) => (
                    <div key={product._id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ৳ {product.sellingPrice} each
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromOrder(product._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Qty:</span>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                product._id,
                                parseInt(e.target.value),
                              )
                            }
                            min="1"
                            max={product.currentQty}
                            className="w-16 px-2 py-1 text-gray-600 text-sm border border-gray-300 rounded"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          ৳{" "}
                          {(product.sellingPrice * product.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FaUser /> Customer Information
                </h3>
                <p className="text-xs text-gray-500">
                  * Name and Phone are required
                </p>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={customerForm.name}
                    onChange={handleCustomerChange}
                    placeholder="Enter customer name"
                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerForm.phone}
                    onChange={handleCustomerChange}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customerForm.email}
                    onChange={handleCustomerChange}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    District (Optional)
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={customerForm.district}
                    onChange={handleCustomerChange}
                    placeholder="Enter district"
                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Police Station / Thana (Optional)
                  </label>
                  <input
                    type="text"
                    name="policeStation"
                    value={customerForm.policeStation}
                    onChange={handleCustomerChange}
                    placeholder="Enter police station"
                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Address (Optional)
                  </label>
                  <textarea
                    name="address"
                    value={customerForm.address}
                    onChange={handleCustomerChange}
                    rows="2"
                    placeholder="Enter full address"
                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                  <FaTag className="text-gray-600 text-sm sm:text-base" /> Order
                  Summary
                </h3>
              </div>

              <div className="p-3 sm:p-4 space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <span className="font-semibold text-gray-800">
                    ৳ {calculateSubtotal().toFixed(2)}
                  </span>
                </div>

                {/* Delivery Charge */}
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 text-sm">
                  <span className="text-gray-600 font-medium w-full xs:w-auto">
                    Delivery Charge:
                  </span>
                  <div className="flex items-center gap-2 w-full xs:w-auto">
                    <span className="text-gray-500 text-xs">৳</span>
                    <input
                      type="number"
                      value={deliveryCharge}
                      onChange={(e) =>
                        setDeliveryCharge(parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="10"
                      className="flex-1 xs:w-28 px-2 py-1.5 text-gray-700 text-sm text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Discount Section */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 text-sm mb-2">
                    <span className="text-gray-600 font-medium">Discount:</span>
                    <div className="flex flex-wrap gap-2 w-full xs:w-auto">
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="flex-1 xs:flex-none px-2 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white"
                      >
                        <option value="fixed" className="text-gray-700">
                          Fixed (৳)
                        </option>
                        <option value="percentage" className="text-gray-700">
                          Percentage (%)
                        </option>
                      </select>
                      <div className="flex items-center gap-1 flex-1 xs:flex-none">
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) =>
                            setDiscount(parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          step={discountType === "percentage" ? "1" : "10"}
                          className="w-full xs:w-24 px-2 py-1.5 text-gray-700 text-sm text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                        />
                        {discountType === "percentage" && (
                          <span className="text-gray-500 text-sm">%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-green-600">Discount Amount:</span>
                      <span className="text-green-600 font-medium">
                        - ৳ {calculateDiscountAmount().toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-800">
                      Grand Total:
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-blue-600">
                      ৳ {calculateGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    placeholder="Additional notes for this order..."
                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting || selectedProducts.length === 0}
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 text-sm sm:text-base"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin text-white" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="text-white" />
                      <span>Create Custom Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Print Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-900 to-purple-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaBarcode /> Print Barcodes
              </h2>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {barcodeProducts.length === 0 ? (
                <div className="text-center py-8">
                  <FaBarcode className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No products selected for barcode printing
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click the barcode icon on any product to add it
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <h3 className="font-semibold text-gray-800">
                      Selected Products
                    </h3>
                    {barcodeProducts.map((product) => (
                      <div
                        key={product._id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Barcode: {product.barcode}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value);
                              if (newQty > 0) {
                                setBarcodeProducts((prev) =>
                                  prev.map((p) =>
                                    p._id === product._id
                                      ? { ...p, quantity: newQty }
                                      : p,
                                  ),
                                );
                              }
                            }}
                            min="1"
                            className="w-20 px-2 py-1 text-sm text-gray-600 border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => {
                              setBarcodeProducts((prev) =>
                                prev.filter((p) => p._id !== product._id),
                              );
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setBarcodeProducts([])}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handlePrintBarcodes}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      <FaPrint /> Print Barcodes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSales;
