// app/components/admin/dashboard/Orders.jsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaPencilAlt,
  FaTruck,
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaShoppingCart,
  FaUser,
  FaCalendarAlt,
  FaPrint,
  FaQrcode,
  FaPhone,
  FaFilter,
  FaTimes,
  FaSpinner,
  FaEye,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { IoQrCode, IoCheckmarkCircle, IoBagCheck } from "react-icons/io5";
import { GiDeliveryDrone } from "react-icons/gi";
import toast from "react-hot-toast";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingTrackingId, setEditingTrackingId] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [editingStatus, setEditingStatus] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [expandedProducts, setExpandedProducts] = useState({});
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const itemsPerPage = 50;

  console.log(orders);

  const statusOptions = [
    "Pending Confirmation",
    "Processing",
    "Ready to Ship",
    "In Transit",
    "Delivered",
    "Cancelled",
  ];

  const statusColors = {
    "Pending Confirmation": "bg-orange-100 text-orange-700",
    Processing: "bg-blue-100 text-blue-700",
    "Ready to Ship": "bg-purple-100 text-purple-700",
    "In Transit": "bg-indigo-100 text-indigo-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };

  const statusIcons = {
    "Pending Confirmation": <FaClock className="text-orange-500" />,
    Processing: <FaSpinner className="text-blue-500 animate-spin" />,
    "Ready to Ship": <IoBagCheck className="text-purple-500" />,
    "In Transit": <GiDeliveryDrone className="text-indigo-500" />,
    Delivered: <IoCheckmarkCircle className="text-green-500" />,
    Cancelled: <FaBoxOpen className="text-red-500" />,
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/v1/admin/orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
        setTotalPages(data.pagination.totalPages);
        setTotalOrders(data.pagination.totalItems);
      } else {
        toast.error(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Update order status
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/v1/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
        setEditingStatus(null);
        setSelectedStatus("");
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Update tracking ID
  const handleTrackingUpdate = async (orderId, trackingId) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/v1/admin/orders/${orderId}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierTrackingId: trackingId }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Tracking ID updated successfully");
        fetchOrders();
        setEditingTrackingId(null);
        setTrackingInput("");
      } else {
        toast.error(data.message || "Failed to update tracking ID");
      }
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast.error("Failed to update tracking ID");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Toggle products expansion
  const toggleProducts = (orderId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Print Shipping Label - Fixed version
  const handlePrintShippingLabel = (order) => {
    const printWindow = window.open("", "_blank");

    const labelHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Label - ${order._id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .label-container {
              max-width: 400px;
              width: 100%;
              margin: 0 auto;
              border: 2px dashed #333;
              padding: 20px;
              border-radius: 8px;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
            }
            .tracking-id {
              font-size: 18px;
              font-weight: bold;
              color: #1e3a8a;
            }
            .basic-info {
              margin-top: 10px;
              font-size: 14px;
            }
            .basic-info div {
              margin: 5px 0;
            }
            .qr-code {
              text-align: center;
            }
            .qr-code canvas {
              width: 80px;
              height: 80px;
            }
            .address {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 14px;
            }
            .address strong {
              display: block;
              margin-bottom: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .label-container {
                border: 1px solid #ccc;
                box-shadow: none;
              }
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <div>
                <div class="tracking-id">#${order?.courierTrackingId || "N/A"}</div>
                <div class="basic-info">
                  <div><strong>Name:</strong> ${order?.customer?.name || order?.buyer?.name || "N/A"}</div>
                  <div><strong>Phone:</strong> ${order?.customer?.phone || order?.buyer?.phone || "N/A"}</div>
                  <div><strong>Due Amount:</strong> Tk. ${order?.payment !== "cod" ? 0 : ((order?.subTotal || 0) + (Number(order?.deliveryCharge) || 0) - (Number(order?.customDiscount) || 0) - (order?.defaultDiscount || 0)).toFixed(2)}</div>
                </div>
              </div>
              <div class="qr-code">
                <div id="qrcode"></div>
                <div class="footer">lizfashions.store</div>
              </div>
            </div>
            <div class="address">
              <strong>Delivery Address:</strong>
              <p>${order?.customer?.address || order?.buyer?.address || "N/A"}</p>
            </div>
            <div class="footer">
              <p>Thank you for shopping with LiZ Fashions</p>
            </div>
          </div>
          <script>
            new QRCode(document.getElementById("qrcode"), {
              text: "https://lizfashions.store/",
              width: 80,
              height: 80
            });
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(labelHTML);
    printWindow.document.close();
  };

  // Print Invoice - Fixed version with proper new tab and printing
  const handlePrintInvoice = (order) => {
    // Create a new tab
    const printTab = window.open();

    if (!printTab) {
      toast.error("Please allow pop-ups to print invoices");
      return;
    }

    const calculateTotal = () => {
      let total = order?.subTotal || 0;
      total += Number(order?.deliveryCharge) || 0;
      total -= order?.defaultDiscount || 0;
      total -= Number(order?.customDiscount) || 0;
      return total.toFixed(2);
    };

    // Get payment method safely
    const getPaymentMethod = () => {
      const payment = order?.payment;
      if (!payment) return "N/A";
      if (typeof payment === "string") return payment.toUpperCase();
      if (payment.method) return payment.method.toUpperCase();
      return "N/A";
    };

    const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${order._id}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #ddd;
          }
          .company h1 {
            margin: 0;
            color: #1e3a8a;
            font-size: 24px;
          }
          .company p {
            margin: 5px 0;
            color: #666;
            font-size: 12px;
          }
          .customer-info {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .customer-info p {
            margin: 5px 0;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
          }
          .total-section p {
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company">
              <h1>LiZ Fashions</h1>
              <p>+880 1303 934 257</p>
              <p>support@lizfashions.store</p>
              <p>lizfashions.store</p>
            </div>
            <div>
              <h3>INVOICE</h3>
              <p><strong>Order ID:</strong> ${order._id.substring(0, 12)}...</p>
              <p><strong>Date:</strong> ${moment(order.createdAt).format("DD-MM-YYYY")}</p>
            </div>
          </div>

          <div class="customer-info">
            <p><strong>Customer Name:</strong> ${order?.customer?.name || order?.buyer?.name || "N/A"}</p>
            <p><strong>Phone:</strong> ${order?.customer?.phone || order?.buyer?.phone || "N/A"}</p>
            <p><strong>Address:</strong> ${order?.customer?.address || order?.buyer?.address || "N/A"}</p>
            <p><strong>Payment Method:</strong> ${getPaymentMethod()}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                order?.products
                  ?.map(
                    (product, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${product.name}</td>
                  <td>${product.amount}</td>
                  <td>Tk. ${product.sellingPrice}</td>
                  <td>Tk. ${(product.sellingPrice * product.amount).toFixed(2)}</td>
                </tr>
              `,
                  )
                  .join("") || '<tr><td colspan="5">No products found</td></tr>'
              }
            </tbody>
          </table>

          <div class="total-section">
            <p><strong>Subtotal:</strong> Tk. ${order?.subTotal?.toFixed(2) || 0}</p>
            <p><strong>Delivery Charge:</strong> Tk. ${order?.deliveryCharge || 0}</p>
            ${order?.defaultDiscount > 0 ? `<p><strong>Default Discount:</strong> - Tk. ${order?.defaultDiscount}</p>` : ""}
            ${order?.customDiscount ? `<p><strong>Custom Discount:</strong> - Tk. ${order?.customDiscount}</p>` : ""}
            <h3><strong>Grand Total:</strong> Tk. ${calculateTotal()}</h3>
          </div>

          <div class="footer">
            <p>Thank you for shopping with LiZ Fashions!</p>
            <p>This is a computer generated invoice</p>
          </div>
        </div>
        <script>
          // Auto-print when page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

    printTab.document.write(invoiceHTML);
    printTab.document.close();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // Shimmer Loading Component
  const ShimmerRow = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-5 bg-gray-200 rounded w-40"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Calculate order summary
  const getOrderSummary = (order) => {
    const subtotal = order?.subTotal || 0;
    const deliveryCharge = Number(order?.deliveryCharge) || 0;
    const defaultDiscount = order?.defaultDiscount || 0;
    const customDiscount = Number(order?.customDiscount) || 0;
    const total = subtotal + deliveryCharge - defaultDiscount - customDiscount;

    return { subtotal, deliveryCharge, defaultDiscount, customDiscount, total };
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(150vh)] md:h-[calc(120vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaShoppingCart /> Order Management
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Manage and track all customer orders
            </p>
          </div>
          <div className="flex gap-2">
            <div className="text-right">
              <p className="text-white text-sm">Total Orders</p>
              <p className="text-yellow-400 text-2xl font-bold">
                {totalOrders}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaShoppingCart className="text-blue-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{totalOrders}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaClock className="text-orange-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            {orders.filter((o) => o.status === "Pending Confirmation").length}
          </p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaSpinner className="text-blue-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            {orders.filter((o) => o.status === "Processing").length}
          </p>
          <p className="text-xs text-gray-500">Processing</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <GiDeliveryDrone className="text-indigo-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            {orders.filter((o) => o.status === "In Transit").length}
          </p>
          <p className="text-xs text-gray-500">In Transit</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaCheckCircle className="text-green-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            {orders.filter((o) => o.status === "Delivered").length}
          </p>
          <p className="text-xs text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <FaBoxOpen className="text-red-500 text-xl mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">
            {orders.filter((o) => o.status === "Cancelled").length}
          </p>
          <p className="text-xs text-gray-500">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 flex-shrink-0 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div className="sm:w-48 relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 appearance-none bg-white"
            >
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

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

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <ShimmerRow key={i} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FaBoxOpen className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">
              No Orders Found
            </h3>
            <p className="text-gray-400">
              No orders match your search criteria
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const summary = getOrderSummary(order);

              return (
                <div
                  key={order._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap justify-between items-start mb-4 pb-3 border-b border-gray-100">
                    <div>
                      <span className="text-xs text-gray-500">Order ID</span>
                      <p className="text-sm font-mono text-gray-700">
                        {order._id.substring(0, 12)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-gray-400 text-xs" />
                      <span className="text-xs text-gray-500">
                        {moment(order.createdAt).format("DD MMM YYYY, hh:mm A")}
                      </span>
                      <span
                        className={`px-2 py-1 flex items-center gap-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                      >
                        {statusIcons[order.status]} {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaUser className="text-blue-500 text-sm" />
                        <span className="text-sm font-medium">
                          Customer Details
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium">
                        {order?.customer?.name || order?.buyer?.name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <FaPhone className="text-xs" />{" "}
                        {order?.customer?.phone || order?.buyer?.phone}
                      </p>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {order?.customer?.address || order?.buyer?.address}
                      </p>
                      <p className="text-xs text-gray-400">
                        Payment:{" "}
                        <span className="font-medium">
                          {typeof order?.payment === "string"
                            ? order?.payment?.toUpperCase()
                            : (order?.payment?.method || "N/A")?.toUpperCase()}
                        </span>
                      </p>
                    </div>

                    {/* Tracking Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaTruck className="text-green-500 text-sm" />
                        <span className="text-sm font-medium">
                          Tracking Info
                        </span>
                      </div>
                      {editingTrackingId === order._id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={trackingInput}
                            onChange={(e) => setTrackingInput(e.target.value)}
                            placeholder="Enter tracking ID"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleTrackingUpdate(order._id, trackingInput)
                              }
                              disabled={updatingOrderId === order._id}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingTrackingId(null);
                                setTrackingInput("");
                              }}
                              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm ${order?.courierTrackingId ? "text-blue-600 font-medium" : "text-gray-400"}`}
                          >
                            {order?.courierTrackingId || "No tracking ID"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingTrackingId(order._id);
                              setTrackingInput(order?.courierTrackingId || "");
                            }}
                            className="text-gray-500 hover:text-blue-600"
                            title="Edit Tracking"
                          >
                            <FaPencilAlt className="text-xs" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Update & Actions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FaPencilAlt className="text-yellow-500 text-sm" />
                        <span className="text-sm font-medium">
                          Update Status
                        </span>
                      </div>
                      {editingStatus === order._id ? (
                        <div className="space-y-2">
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full text-gray-600 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                          >
                            <option value="">Select Status</option>
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(order._id, selectedStatus)
                              }
                              disabled={
                                updatingOrderId === order._id || !selectedStatus
                              }
                              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => {
                                setEditingStatus(null);
                                setSelectedStatus("");
                              }}
                              className="px-3 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingStatus(order._id);
                            setSelectedStatus(order.status);
                          }}
                          className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-1"
                        >
                          <FaPencilAlt className="text-xs" /> Change Status
                        </button>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                        >
                          <FaPrint /> Invoice
                        </button>
                        <button
                          onClick={() => handlePrintShippingLabel(order)}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                        >
                          <FaQrcode /> Label
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Products Section with Collapsible Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleProducts(order._id)}
                      className="flex items-center justify-between w-full text-left mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Products ({order?.products?.length})
                        </span>
                        {expandedProducts[order._id] ? (
                          <FaChevronUp className="text-gray-400 text-xs" />
                        ) : (
                          <FaChevronDown className="text-gray-400 text-xs" />
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">
                          Total: Tk. {summary.total.toFixed(2)}
                        </p>
                      </div>
                    </button>

                    {expandedProducts[order._id] && (
                      <div className="mt-3 space-y-3">
                        {/* Products List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {order?.products?.map((product, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {/* Product Image with hover eye */}
                                <div
                                  className="relative w-12 h-12 bg-gray-200 rounded overflow-hidden group"
                                  onMouseEnter={() =>
                                    setHoveredProduct(product.slug)
                                  }
                                  onMouseLeave={() => setHoveredProduct(null)}
                                >
                                  {product.photos?.[0]?.url ? (
                                    <>
                                      <Image
                                        src={product.photos[0].url}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                      />
                                      {hoveredProduct === product.slug && (
                                        <Link
                                          href={`/product/${product.slug}`}
                                          target="_blank"
                                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <FaEye className="text-white text-lg" />
                                        </Link>
                                      )}
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      No img
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {product.name}
                                  </p>
                                  {product.barcode && (
                                    <p className="text-xs text-gray-400">
                                      Barcode: {product.barcode}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  Qty: {product.amount}
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                  Tk.{" "}
                                  {(
                                    product.sellingPrice * product.amount
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Order Summary
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Subtotal:</span>
                              <span className="text-gray-800">
                                Tk. {summary.subtotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Shipping Charge:
                              </span>
                              <span className="text-gray-800">
                                Tk. {summary.deliveryCharge.toFixed(2)}
                              </span>
                            </div>
                            {summary.defaultDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Default Discount:</span>
                                <span>
                                  - Tk. {summary.defaultDiscount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            {summary.customDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Custom Discount:</span>
                                <span>
                                  - Tk. {summary.customDiscount.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                              <span className="text-gray-700">
                                Grand Total:
                              </span>
                              <span className="text-gray-700">
                                Tk. {summary.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Page {currentPage} of {totalPages} ({totalOrders} orders)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
              >
                <FaChevronLeft className="text-xs" /> Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
              >
                Next <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
