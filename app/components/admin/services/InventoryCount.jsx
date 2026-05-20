// app/components/admin/services/InventoryCount.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaCamera,
  FaTimes,
  FaPrint,
  FaBarcode,
  FaCheckCircle,
  FaSpinner,
  FaTrash,
  FaPlus,
  FaMinus,
  FaExclamationTriangle,
  FaCameraRetro,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const InventoryCount = () => {
  const [onlineProducts, setOnlineProducts] = useState([]);
  const [filteredOnlineProducts, setFilteredOnlineProducts] = useState([]);
  const [offlineProducts, setOfflineProducts] = useState([]);
  const [discrepancyProducts, setDiscrepancyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const toastLockRef = useRef(false);
  const scannerRef = useRef(null);

  // Fetch online products from inventory
  const fetchOnlineProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/inventory");
      const data = await response.json();
      if (data.success) {
        const products = data.inventory.map((item) => ({
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
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Play beep sound
  const playBeep = () => {
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 150);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  // Filter products based on search
  useEffect(() => {
    const filtered = onlineProducts.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredOnlineProducts(filtered);
  }, [searchTerm, onlineProducts]);

  // Update discrepancy products
  useEffect(() => {
    const discrepancies = offlineProducts.filter(
      (offline) => offline.countedQuantity > offline.currentQty,
    );
    setDiscrepancyProducts(discrepancies);
  }, [offlineProducts]);

  // Add product to offline list
  const addToOffline = (product, quantity = 1) => {
    setOfflineProducts((prev) => {
      const existingIndex = prev.findIndex(
        (p) => p.barcode === product.barcode,
      );
      let newTotal;
      let updatedList;

      if (existingIndex !== -1) {
        newTotal = prev[existingIndex].countedQuantity + quantity;
        updatedList = [...prev];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          countedQuantity: newTotal,
        };
      } else {
        newTotal = quantity;
        updatedList = [...prev, { ...product, countedQuantity: quantity }];
      }

      setOnlineProducts((prevOnline) =>
        prevOnline.map((p) =>
          p.barcode === product.barcode
            ? { ...p, counted: true, countedQuantity: newTotal }
            : p,
        ),
      );

      playBeep();

      // Prevent duplicate toasts
      if (!toastLockRef.current) {
        toastLockRef.current = true;

        if (newTotal > product.currentQty) {
          toast.error(
            `⚠️ EXCESS: ${product.productName} - Counted ${newTotal} (System: ${product.currentQty})`,
            {
              duration: 3000,
              icon: "⚠️",
            },
          );
        } else if (newTotal === product.currentQty) {
          toast.success(`✅ ${product.productName} fully counted!`);
        } else {
          toast.success(
            `📦 ${product.productName}: ${newTotal}/${product.currentQty}`,
          );
        }

        // Reset toast lock after duration
        setTimeout(() => {
          toastLockRef.current = false;
        }, 1000);
      }

      return updatedList;
    });
  };

  // Remove from offline list
  const removeFromOffline = (barcode) => {
    const product = offlineProducts.find((p) => p.barcode === barcode);
    if (product) {
      setOfflineProducts((prev) => prev.filter((p) => p.barcode !== barcode));
      setOnlineProducts((prev) =>
        prev.map((p) =>
          p.barcode === barcode
            ? { ...p, counted: false, countedQuantity: 0 }
            : p,
        ),
      );
      toast.success(`${product.productName} removed`);
    }
  };

  // Update offline product quantity
  const updateOfflineQuantity = (barcode, newQuantity) => {
    const onlineProduct = onlineProducts.find((p) => p.barcode === barcode);
    if (!onlineProduct) return;

    if (newQuantity < 1) {
      removeFromOffline(barcode);
      return;
    }

    setOfflineProducts((prev) =>
      prev.map((p) =>
        p.barcode === barcode ? { ...p, countedQuantity: newQuantity } : p,
      ),
    );

    setOnlineProducts((prev) =>
      prev.map((p) =>
        p.barcode === barcode ? { ...p, countedQuantity: newQuantity } : p,
      ),
    );

    // Fixed: Use toast.error instead of toast.warning
    if (newQuantity > onlineProduct.currentQty) {
      toast.error(
        `⚠️ EXCESS: ${onlineProduct.productName} - Counted ${newQuantity} (System: ${onlineProduct.currentQty})`,
        {
          duration: 3000,
          icon: "⚠️",
        },
      );
    } else if (newQuantity === onlineProduct.currentQty) {
      toast.success(`✅ ${onlineProduct.productName} fully counted!`);
    }
  };
  const processingRef = useRef(false);
  const lastScannedRef = useRef(null);

  const processBarcode = async (barcodeValue) => {
    // Prevent duplicate processing
    if (processingRef.current) {
      console.log("Already processing a barcode, ignoring...");
      return;
    }

    // Prevent processing same barcode twice in a row
    if (lastScannedRef.current === barcodeValue) {
      console.log("Duplicate barcode ignored:", barcodeValue);
      return;
    }

    if (!barcodeValue || barcodeValue.trim() === "") {
      toast.error("Please enter a valid barcode");
      return;
    }

    processingRef.current = true;
    lastScannedRef.current = barcodeValue;

    const product = onlineProducts.find((p) => p.barcode === barcodeValue);

    if (product) {
      addToOffline(product, 1);
    } else {
      toast.error(`Product with barcode ${barcodeValue} not found`);
    }

    // Reset processing lock after delay
    setTimeout(() => {
      processingRef.current = false;
    }, 1000);
  };

  // Start camera for scanning
  const startCamera = async () => {
    setCameraError(false);

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {}
      }

      scannerRef.current = new Html5Qrcode("video-preview");

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Stop camera immediately
          stopCamera();
          // Process barcode with lock
          processBarcode(decodedText);
        },
        (error) => {
          // Silent fail
        },
      );

      setIsScanning(true);
    } catch (error) {
      console.error("Error starting camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
      setCameraError(true);
    }
  };

  // Stop camera
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
  };

  // Print report
  const handlePrintMissing = () => {
    const missingProducts = onlineProducts.filter(
      (p) => !p.counted || p.countedQuantity < p.currentQty,
    );

    const printWindow = window.open("", "_blank");
    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Count Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; }
            .header h1 { color: #1e3a8a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .excess { background-color: #ffeb3b; color: #d32f2f; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Count Report</h1>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
          <h2>Summary</h2>
          </table>
            <tr><th>Total Products</th><td class="text-right">${onlineProducts.length}</td></tr>
            <tr><th>Total Counted Items</th><td class="text-right">${offlineProducts.reduce((s, p) => s + p.countedQuantity, 0)}</td></tr>
            <tr class="excess"><th>Excess Products</th><td class="text-right">${discrepancyProducts.length}</td></tr>
          </table>
          ${
            discrepancyProducts.length > 0
              ? `
            <h2>Excess Products</h2>
            <table>
              <thead><tr><th>Product</th><th>Barcode</th><th>System Qty</th><th>Counted Qty</th><th>Excess</th></tr></thead>
              <tbody>
                ${discrepancyProducts
                  .map(
                    (p) => `
                  <tr class="excess">
                    <td>${p.productName}</td>
                    <td>${p.barcode || "-"}</td>
                    <td class="text-right">${p.currentQty}</td>
                    <td class="text-right">${p.countedQuantity}</td>
                    <td class="text-right">+${p.countedQuantity - p.currentQty}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : ""
          }
          <h2>Products Not Fully Counted</h2>
          <table>
            <thead><tr><th>Product</th><th>Barcode</th><th>System Qty</th><th>Counted</th><th>Remaining</th></tr></thead>
            <tbody>
              ${missingProducts
                .map(
                  (p) => `
                <tr>
                  <td>${p.productName}</td>
                  <td>${p.barcode || "-"}</td>
                  <td class="text-right">${p.currentQty}</td>
                  <td class="text-right">${p.countedQuantity || 0}</td>
                  <td class="text-right">${p.currentQty - (p.countedQuantity || 0)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer"><p>Generated by Inventory Count System</p></div>
          <script>setTimeout(() => window.print(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(129vh)] md:h-[calc(90vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaBarcode className="text-white" /> Inventory Count
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Count offline inventory and compare with online records
            </p>
          </div>
          <div className="flex gap-2">
            {discrepancyProducts.length > 0 && (
              <div className="bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2">
                <FaExclamationTriangle className="text-white" />
                <span className="text-white">
                  {discrepancyProducts.length} Excess
                </span>
              </div>
            )}
            <button
              onClick={handlePrintMissing}
              className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <FaPrint className="text-white" /> Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Excess Alert */}
      {discrepancyProducts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4 rounded">
          <div className="flex items-center">
            <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <p className="text-sm text-yellow-800">
              <span className="font-bold text-yellow-900">
                ⚠️ EXCESS INVENTORY DETECTED!
              </span>
              <br />
              <span className="text-yellow-700">
                {discrepancyProducts.length} product(s) have excess count. Total
                excess: +
                {discrepancyProducts.reduce(
                  (sum, p) => sum + (p.countedQuantity - p.currentQty),
                  0,
                )}{" "}
                units.
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="block md:flex-1 p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Online Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[60vh] md:h-full">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-red-700">
                    Online Products
                  </h3>
                  <p className="text-xs text-gray-600">
                    Products that need counting
                  </p>
                </div>
                <button
                  onClick={() => setShowCamera(true)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaCamera className="text-white" /> Scan
                </button>
              </div>
            </div>
            <div
              className="overflow-x-auto flex-1"
              style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}
            >
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-3xl text-yellow-600" />
                </div>
              ) : (
                <>
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search by name or barcode..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg text-gray-800 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-gray-700 text-left font-semibold">
                          Product
                        </th>
                        <th className="px-4 py-3 text-gray-700 text-left font-semibold">
                          Barcode
                        </th>
                        <th className="px-4 py-3 text-gray-700 text-center font-semibold">
                          System
                        </th>
                        <th className="px-4 py-3 text-gray-700 text-center font-semibold">
                          Counted
                        </th>
                        <th className="px-4 py-3 text-gray-700 text-center font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOnlineProducts.map((product) => {
                        const counted = offlineProducts.find(
                          (p) => p.barcode === product.barcode,
                        );
                        const isExcess =
                          counted &&
                          counted.countedQuantity > product.currentQty;
                        return (
                          <tr
                            key={product._id}
                            className={
                              isExcess ? "bg-yellow-50" : "hover:bg-gray-50"
                            }
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">
                                {product.productName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {product.categoryName}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-gray-700">
                              {product.barcode || "-"}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-800">
                              {product.currentQty}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={
                                  isExcess
                                    ? "text-red-700 font-bold"
                                    : counted
                                      ? "text-green-700 font-semibold"
                                      : "text-gray-600"
                                }
                              >
                                {counted?.countedQuantity || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => addToOffline(product, 1)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                              >
                                + Add
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>

          {/* Counted Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[50vh] md:h-full">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-green-700">
                    Counted Products
                  </h3>
                  <p className="text-xs text-gray-600">
                    {offlineProducts.length} items counted
                  </p>
                </div>
              </div>
            </div>
            <div
              className="overflow-x-auto flex-1"
              style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}
            >
              {offlineProducts.length === 0 ? (
                <div className="text-center py-12">
                  <FaBarcode className="text-4xl mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No products counted yet</p>
                  <p className="text-xs text-gray-500">
                    Scan barcodes to begin
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-gray-700 text-left font-semibold">
                        Product
                      </th>
                      <th className="px-4 py-3 text-gray-700 text-left font-semibold">
                        Barcode
                      </th>
                      <th className="px-4 py-3 text-gray-700 text-center font-semibold">
                        Counted
                      </th>
                      <th className="px-4 py-3 text-gray-700 text-center font-semibold">
                        Status
                      </th>
                      <th className="px-4 py-3 text-gray-700 text-center font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {offlineProducts.map((product) => {
                      const isExcess =
                        product.countedQuantity > product.currentQty;
                      return (
                        <tr
                          key={product._id}
                          className={isExcess ? "bg-red-50" : "bg-green-50"}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">
                              {product.productName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {product.categoryName}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-gray-700">
                            {product.barcode || "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  updateOfflineQuantity(
                                    product.barcode,
                                    product.countedQuantity - 1,
                                  )
                                }
                                className="text-gray-600 hover:text-red-600 transition-colors"
                              >
                                <FaMinus />
                              </button>
                              <input
                                type="number"
                                value={product.countedQuantity}
                                onChange={(e) =>
                                  updateOfflineQuantity(
                                    product.barcode,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-16 px-2 py-1 text-center border rounded text-gray-800 font-semibold"
                              />
                              <button
                                onClick={() =>
                                  updateOfflineQuantity(
                                    product.barcode,
                                    product.countedQuantity + 1,
                                  )
                                }
                                className="text-gray-600 hover:text-green-600 transition-colors"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isExcess ? (
                              <span className="text-red-700 text-xs font-bold">
                                EXCESS +
                                {product.countedQuantity - product.currentQty}
                              </span>
                            ) : product.countedQuantity ===
                              product.currentQty ? (
                              <span className="text-green-700 text-xs font-semibold">
                                Matched
                              </span>
                            ) : (
                              <span className="text-yellow-700 text-xs font-semibold">
                                Partial
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeFromOffline(product.barcode)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remove from offline"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal - Removed manual entry */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Scan Barcode</h2>
              <button
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-4">
              {/* Camera Preview */}
              <div className="relative">
                <div
                  id="video-preview"
                  className="w-full bg-black rounded-lg"
                  style={{ minHeight: "300px" }}
                ></div>
                {!isScanning && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <button
                      onClick={startCamera}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FaCameraRetro /> Start Camera to Scan
                    </button>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="mt-3 text-center text-green-600 font-semibold">
                  <FaSpinner className="inline animate-spin mr-2" />
                  Camera active - Scan one barcode at a time
                </div>
              )}

              {cameraError && (
                <button
                  onClick={startCamera}
                  className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Camera
                </button>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  📷 Point camera at barcode. Camera will automatically stop
                  after each scan.
                  <br />
                  Click "Start Camera" again for next product.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCount;
