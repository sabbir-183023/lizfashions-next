// app/components/admin/services/InventoryCount.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaSearch,
  FaCamera,
  FaTimes,
  FaPrint,
  FaBarcode,
  FaCheckCircle,
  FaSpinner,
  FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Image from "next/image";
import Webcam from "react-webcam";
import jsBarcode from "jsbarcode";

const InventoryCount = () => {
  const [onlineProducts, setOnlineProducts] = useState([]);
  const [filteredOnlineProducts, setFilteredOnlineProducts] = useState([]);
  const [offlineProducts, setOfflineProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  
  const webcamRef = useRef(null);
  const audioRef = useRef(null);

  // Fetch online products from inventory
  const fetchOnlineProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/inventory");
      const data = await response.json();
      if (data.success) {
        const products = data.inventory.map(item => ({
          ...item,
          counted: false,
          countedQuantity: 0,
        }));
        setOnlineProducts(products);
        setFilteredOnlineProducts(products);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineProducts();
    // Create beep audio element
    const audio = new Audio("/beep.mp3");
    audioRef.current = audio;
  }, []);

  // Filter products based on search
  useEffect(() => {
    const filtered = onlineProducts.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOnlineProducts(filtered);
  }, [searchTerm, onlineProducts]);

  // Add product to offline list
  const addToOffline = (product, quantity = 1) => {
    // Check if product already exists in offline list
    const existingOffline = offlineProducts.find(p => p.barcode === product.barcode);
    
    if (existingOffline) {
      // Update existing offline product quantity
      const newQuantity = existingOffline.countedQuantity + quantity;
      if (newQuantity > product.currentQty) {
        toast.error(`Cannot exceed available stock (${product.currentQty})`);
        return;
      }
      setOfflineProducts(prev =>
        prev.map(p =>
          p.barcode === product.barcode
            ? { ...p, countedQuantity: newQuantity }
            : p
        )
      );
    } else {
      // Add new offline product
      if (quantity > product.currentQty) {
        toast.error(`Cannot exceed available stock (${product.currentQty})`);
        return;
      }
      setOfflineProducts(prev => [
        ...prev,
        {
          ...product,
          countedQuantity: quantity,
        },
      ]);
    }

    // Update online product count status
    setOnlineProducts(prev =>
      prev.map(p =>
        p.barcode === product.barcode
          ? { ...p, counted: true, countedQuantity: (p.countedQuantity || 0) + quantity }
          : p
      )
    );

    // Play beep sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    toast.success(`${product.productName} added to offline count`);
  };

  // Remove from offline list
  const removeFromOffline = (barcode) => {
    const product = offlineProducts.find(p => p.barcode === barcode);
    if (product) {
      setOfflineProducts(prev => prev.filter(p => p.barcode !== barcode));
      setOnlineProducts(prev =>
        prev.map(p =>
          p.barcode === barcode
            ? { ...p, counted: false, countedQuantity: 0 }
            : p
        )
      );
      toast.success(`${product.productName} removed from offline count`);
    }
  };

  // Update offline product quantity
  const updateOfflineQuantity = (barcode, newQuantity) => {
    const product = offlineProducts.find(p => p.barcode === barcode);
    const onlineProduct = onlineProducts.find(p => p.barcode === barcode);
    
    if (newQuantity < 1) {
      removeFromOffline(barcode);
      return;
    }
    
    if (newQuantity > onlineProduct.currentQty) {
      toast.error(`Cannot exceed available stock (${onlineProduct.currentQty})`);
      return;
    }
    
    setOfflineProducts(prev =>
      prev.map(p =>
        p.barcode === barcode ? { ...p, countedQuantity: newQuantity } : p
      )
    );
    
    setOnlineProducts(prev =>
      prev.map(p =>
        p.barcode === barcode
          ? { ...p, countedQuantity: newQuantity }
          : p
      )
    );
  };

  // Handle barcode scan from camera
  const handleBarcodeScan = useCallback((barcode) => {
    if (!barcode || scanning) return;
    
    setScanning(true);
    const product = onlineProducts.find(p => p.barcode === barcode);
    
    if (product) {
      if (product.countedQuantity >= product.currentQty) {
        toast.error(`All stock of ${product.productName} has been counted`);
      } else {
        addToOffline(product, 1);
      }
      setScannedBarcode(barcode);
      setTimeout(() => setScannedBarcode(""), 1000);
    } else {
      toast.error(`Product with barcode ${barcode} not found`);
    }
    
    setTimeout(() => setScanning(false), 1000);
  }, [onlineProducts]);

  // Process video frames for barcode detection
  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    // Here you would typically use a barcode detection library
    // For now, we'll use a simple approach with input field
    // You can integrate a proper barcode scanner library like @zxing/library
    const barcode = prompt("Enter barcode number (or scan with external scanner):");
    if (barcode) {
      handleBarcodeScan(barcode);
    }
  }, [handleBarcodeScan]);

  // Start continuous scanning
  const startScanning = () => {
    // For continuous scanning, you would set up an interval to capture frames
    // This is a simplified version - for production, use a proper barcode scanner library
    const interval = setInterval(() => {
      if (webcamRef.current && !scanning) {
        // Capture and process frame
        capture();
      }
    }, 500);
    
    return () => clearInterval(interval);
  };

  // Print missing products (online but not offline)
  const handlePrintMissing = () => {
    const missingProducts = onlineProducts.filter(p => !p.counted || p.countedQuantity < p.currentQty);
    
    if (missingProducts.length === 0) {
      toast.success("All products have been counted!");
      return;
    }
    
    const printWindow = window.open("", "_blank");
    
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Missing Products Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              padding: 20px;
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .missing-badge {
              color: #dc2626;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Missing Products Report</h1>
            <p>Products that are online but not yet counted offline</p>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Online Quantity</th>
                <th>Counted Quantity</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${missingProducts.map((product, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${product.productName}</td>
                  <td>${product.barcode || '-'}</td>
                  <td>${product.categoryName}</td>
                  <td class="text-right">${product.currentQty}</td>
                  <td class="text-right">${product.countedQuantity || 0}</td>
                  <td class="text-right missing-badge">${product.currentQty - (product.countedQuantity || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="missing-badge">
                <td colspan="6" class="text-right"><strong>Total Missing Products:</strong></td>
                <td class="text-right"><strong>${missingProducts.length}</strong></td>
               </tr>
            </tfoot>
          </table>
          
          <div class="footer">
            <p>Generated by Inventory Count System</p>
          </div>
          <script>
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  // Generate barcode image for offline products (optional)
  const generateBarcodeImage = (barcode) => {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 60;
    
    jsBarcode(canvas, barcode, {
      format: "CODE128",
      width: 1.5,
      height: 40,
      displayValue: true,
      fontSize: 12,
      margin: 5,
    });
    
    return canvas.toDataURL("image/png");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(150vh)] md:h-[calc(120vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaBarcode /> Inventory Count
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Count offline inventory and compare with online records
            </p>
          </div>
          <button
            onClick={handlePrintMissing}
            className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
          >
            <FaPrint /> Print Missing Products
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Online Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-red-600 flex items-center gap-2">
                  <FaTimes className="text-red-500" /> Online Products
                </h3>
                <p className="text-xs text-gray-500">
                  Products from inventory that need counting
                </p>
              </div>
              <div className="relative w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by name or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  onClick={() => setShowCamera(true)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                  title="Scan Barcode"
                >
                  <FaCamera className="text-sm" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-3xl text-yellow-500" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Barcode</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Online Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Counted</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOnlineProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{product.productName}</p>
                            <p className="text-xs text-gray-500">{product.categoryName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {product.barcode || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-800">
                          {product.currentQty}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-semibold ${product.counted ? 'text-green-600' : 'text-red-500'}`}>
                            {product.countedQuantity || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!product.counted || product.countedQuantity < product.currentQty ? (
                            <button
                              onClick={() => addToOffline(product, 1)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                              disabled={product.countedQuantity >= product.currentQty}
                            >
                              + Add to Offline
                            </button>
                          ) : (
                            <span className="text-green-600 text-xs flex items-center gap-1">
                              <FaCheckCircle /> Complete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredOnlineProducts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Offline Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-green-600 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" /> Offline Counted Products
              </h3>
              <p className="text-xs text-gray-500">
                Products marked as counted offline ({offlineProducts.length} items)
              </p>
            </div>
            
            <div className="overflow-x-auto flex-1">
              {offlineProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaBarcode className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p>No products marked offline yet</p>
                  <p className="text-xs">Scan barcodes or add from online table</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Barcode</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Counted Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {offlineProducts.map((product) => (
                      <tr key={product._id} className="bg-green-50 hover:bg-green-100">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{product.productName}</p>
                          <p className="text-xs text-gray-500">{product.categoryName}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {product.barcode || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={product.countedQuantity}
                            onChange={(e) => updateOfflineQuantity(product.barcode, parseInt(e.target.value) || 0)}
                            min="1"
                            max={product.currentQty}
                            className="w-20 px-2 py-1 text-sm text-center text-gray-700 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-400"
                          />
                          <span className="text-xs text-gray-500 ml-1">/ {product.currentQty}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeFromOffline(product.barcode)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove from offline"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-gray-600 text-right font-semibold">
                        Total Unique Products:
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600">
                        {offlineProducts.length}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal for Barcode Scanning */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaCamera /> Scan Barcode
              </h2>
              <button
                onClick={() => setShowCamera(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "environment"
                  }}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-32 border-2 border-yellow-400 rounded-lg"></div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={capture}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FaCamera /> Capture & Scan
                </button>
                <button
                  onClick={() => setShowCamera(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter barcode manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter barcode number"
                    className="flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleBarcodeScan(e.target.value);
                        e.target.value = '';
                        setShowCamera(false);
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousSibling;
                      if (input.value) {
                        handleBarcodeScan(input.value);
                        input.value = '';
                        setShowCamera(false);
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {scannedBarcode && (
                <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
                  ✅ Product added: {scannedBarcode}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCount;