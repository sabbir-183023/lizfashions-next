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

  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const toastLockRef = useRef(false);
  const scanTimeoutRef = useRef(null);

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
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  // Play beep sound
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

  // Add product to offline list - with toast lock to prevent duplicates
  const addToOffline = (product, quantity = 1) => {
    setOfflineProducts((prev) => {
      const existingIndex = prev.findIndex((p) => p.barcode === product.barcode);
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
            : p
        )
      );

      playBeep();

      // Only show one toast per action
      if (!toastLockRef.current) {
        toastLockRef.current = true;
        
        if (newTotal > product.currentQty) {
          toast.error(`Excess: ${product.productName}`);
        } else if (newTotal === product.currentQty) {
          toast.success(`Complete: ${product.productName}`);
        } else {
          toast.success(`${product.productName}: ${newTotal}/${product.currentQty}`);
        }
        
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
          p.barcode === barcode ? { ...p, counted: false, countedQuantity: 0 } : p
        )
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
      prev.map((p) => (p.barcode === barcode ? { ...p, countedQuantity: newQuantity } : p))
    );

    setOnlineProducts((prev) =>
      prev.map((p) => (p.barcode === barcode ? { ...p, countedQuantity: newQuantity } : p))
    );

    if (!toastLockRef.current) {
      toastLockRef.current = true;
      
      if (newQuantity > onlineProduct.currentQty) {
        toast.error(`Excess: ${onlineProduct.productName}`);
      } else if (newQuantity === onlineProduct.currentQty) {
        toast.success(`Complete: ${onlineProduct.productName}`);
      }
      
      setTimeout(() => {
        toastLockRef.current = false;
      }, 1000);
    }
  };

  // Process barcode scan
  const processBarcode = async (barcodeValue) => {
    if (processingRef.current) {
      return;
    }

    if (!barcodeValue || barcodeValue.trim() === "") {
      toast.error("Invalid barcode");
      return;
    }

    processingRef.current = true;

    const product = onlineProducts.find((p) => p.barcode === barcodeValue);

    if (product) {
      addToOffline(product, 1);
    } else {
      toast.error("Product not found");
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      processingRef.current = false;
    }, 800);
  };

  // Start camera
  const startCamera = async () => {
    setCameraError(false);
    processingRef.current = false;

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {}
      }

      scannerRef.current = new Html5Qrcode("video-preview");

      const config = {
        fps: 15,
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
          processBarcode(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (error) {
      console.error("Error starting camera:", error);
      toast.error("Camera access failed");
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
    processingRef.current = false;
  };

  // Print report
  const handlePrintMissing = () => {
    const missingProducts = onlineProducts.filter((p) => !p.counted || p.countedQuantity < p.currentQty);

    const printWindow = window.open("", "_blank");
    const printHTML = `<!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Count Report</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; margin: 10px; padding: 10px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; }
            .header h1 { color: #1e3a8a; font-size: 1.5rem; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .excess { background-color: #ffeb3b; color: #d32f2f; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Count Report</h1>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
          <h2>Summary</h2>
          <table>
            <tr><th>Total Products</th><td class="text-right">${onlineProducts.length}</td></tr>
            <tr><th>Total Counted Items</th><td class="text-right">${offlineProducts.reduce((s, p) => s + p.countedQuantity, 0)}</td></tr>
            <tr class="excess"><th>Excess Products</th><td class="text-right">${discrepancyProducts.length}</td></tr>
          </table>
          ${discrepancyProducts.length > 0 ? `
            <h2>Excess Products</h2>
            <tr>
              <thead><tr><th>Product</th><th>Barcode</th><th>System Qty</th><th>Counted Qty</th><th>Excess</th></tr></thead>
              <tbody>
                ${discrepancyProducts.map(p => `
                  <tr class="excess">
                    <td>${p.productName}</td>
                    <td>${p.barcode || "-"}</td>
                    <td class="text-right">${p.currentQty}</td>
                    <td class="text-right">${p.countedQuantity}</td>
                    <td class="text-right">+${p.countedQuantity - p.currentQty}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : ""}
          <h2>Products Not Fully Counted</h2>
          <table>
            <thead><tr><th>Product</th><th>Barcode</th><th>System Qty</th><th>Counted</th><th>Remaining</th></tr></thead>
            <tbody>
              ${missingProducts.map(p => `
                <tr>
                  <td>${p.productName}</td>
                  <td>${p.barcode || "-"}</td>
                  <td class="text-right">${p.currentQty}</td>
                  <td class="text-right">${p.countedQuantity || 0}</td>
                  <td class="text-right">${p.currentQty - (p.countedQuantity || 0)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer"><p>Generated by Inventory Count System</p></div>
          <script>setTimeout(() => window.print(), 500);</script>
        </body>
      </html>`;
    printWindow.document.write(printHTML);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[100%]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaBarcode className="text-white" /> Inventory Count
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-0.5">
              Count offline inventory and compare with online records
            </p>
          </div>
          <div className="flex gap-2">
            {discrepancyProducts.length > 0 && (
              <div className="bg-red-600 text-white px-2 sm:px-3 py-1 rounded-lg flex items-center gap-1 text-xs sm:text-sm">
                <FaExclamationTriangle className="text-white" />
                <span>{discrepancyProducts.length} Excess</span>
              </div>
            )}
            <button
              onClick={handlePrintMissing}
              className="bg-red-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-1 text-xs sm:text-sm"
            >
              <FaPrint /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Excess Alert */}
      {discrepancyProducts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 sm:p-3 m-2 sm:m-4 rounded">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-600" />
            <p className="text-xs sm:text-sm text-yellow-800">
              <span className="font-bold">Excess Inventory:</span> {discrepancyProducts.length} product(s) | Total excess: +
              {discrepancyProducts.reduce((sum, p) => sum + (p.countedQuantity - p.currentQty), 0)} units
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 p-2 sm:p-6 overflow-auto">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          {/* Online Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col w-full lg:w-1/2 min-h-[300px] lg:min-h-0">
            <div className="px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-red-700">Online Products</h3>
                  <p className="text-xs text-gray-500">Need counting</p>
                </div>
                <button
                  onClick={() => setShowCamera(true)}
                  className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <FaCamera /> Scan
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-2xl text-yellow-600" />
                </div>
              ) : (
                <>
                  <div className="sticky top-0 bg-white p-2 border-b">
                    <div className="relative">
                      <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-3 py-1 text-xs border rounded-lg text-gray-800"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 text-gray-700 py-2 text-left">Product</th>
                          <th className="px-2 text-gray-700 py-2 text-left hidden sm:table-cell">Barcode</th>
                          <th className="px-2 text-gray-700 py-2 text-center">Sys</th>
                          <th className="px-2 text-gray-700 py-2 text-center">Cnt</th>
                          <th className="px-2 text-gray-700 py-2 text-center">Act</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOnlineProducts.map((product) => {
                          const counted = offlineProducts.find((p) => p.barcode === product.barcode);
                          const isExcess = counted && counted.countedQuantity > product.currentQty;
                          return (
                            <tr key={product._id} className={isExcess ? "bg-yellow-50" : "hover:bg-gray-50"}>
                              <td className="px-2 py-2">
                                <p className="font-medium text-gray-900">{product.productName}</p>
                                <p className="text-xs text-gray-500 hidden sm:block">{product.categoryName}</p>
                               </td>
                              <td className="px-2 py-2 text-gray-600 hidden sm:table-cell">{product.barcode?.slice(-8) || "-"}</td>
                              <td className="px-2 py-2 text-gray-600 text-center font-semibold">{product.currentQty}</td>
                              <td className="px-2 py-2 text-center">
                                <span className={isExcess ? "text-red-600 font-bold" : counted ? "text-green-600" : "text-gray-500"}>
                                  {counted?.countedQuantity || 0}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => addToOffline(product, 1)}
                                  className="bg-green-600 text-white px-2 py-0.5 rounded text-xs hover:bg-green-700"
                                >
                                  +Add
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Counted Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col w-full lg:w-1/2 min-h-[300px] lg:min-h-0">
            <div className="px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-green-700">Counted Products</h3>
                <p className="text-xs text-gray-500">{offlineProducts.length} items</p>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              {offlineProducts.length === 0 ? (
                <div className="text-center py-12">
                  <FaBarcode className="text-3xl mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-500 text-sm">No products counted</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 text-gray-700 py-2 text-left">Product</th>
                        <th className="px-2 text-gray-700 py-2 text-left hidden sm:table-cell">Barcode</th>
                        <th className="px-2 text-gray-700 py-2 text-center">Qty</th>
                        <th className="px-2 text-gray-700 py-2 text-center">Status</th>
                        <th className="px-2 text-gray-700 py-2 text-center">Act</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offlineProducts.map((product) => {
                        const isExcess = product.countedQuantity > product.currentQty;
                        return (
                          <tr key={product._id} className={isExcess ? "bg-red-50" : "bg-green-50"}>
                            <td className="px-2 py-2">
                              <p className="font-medium text-gray-900">{product.productName}</p>
                             </td>
                            <td className="px-2 py-2 text-gray-600 hidden sm:table-cell">{product.barcode?.slice(-8) || "-"}</td>
                            <td className="px-2  py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => updateOfflineQuantity(product.barcode, product.countedQuantity - 1)} className="text-gray-500 hover:text-red-600">
                                  <FaMinus className="text-xs" />
                                </button>
                                <span className="w-8 text-gray-600 text-center font-semibold">{product.countedQuantity}</span>
                                <button onClick={() => updateOfflineQuantity(product.barcode, product.countedQuantity + 1)} className="text-gray-500 hover:text-green-600">
                                  <FaPlus className="text-xs" />
                                </button>
                              </div>
                            </td>
                            <td className="px-2  py-2 text-center">
                              {isExcess ? (
                                <span className="text-red-600 text-xs font-bold">Excess</span>
                              ) : product.countedQuantity === product.currentQty ? (
                                <span className="text-green-600 text-xs">Matched</span>
                              ) : (
                                <span className="text-yellow-600 text-xs">Partial</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-center">
                              <button onClick={() => removeFromOffline(product.barcode)} className="text-red-500 hover:text-red-700">
                                <FaTrash className="text-xs" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Scan Barcode</h2>
              <button onClick={() => { stopCamera(); setShowCamera(false); }} className="text-white">
                <FaTimes />
              </button>
            </div>

            <div className="p-3">
              <div className="relative">
                <div id="video-preview" className="w-full bg-black rounded-lg" style={{ minHeight: "250px" }}></div>
                {!isScanning && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                    <button onClick={startCamera} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
                      <FaCameraRetro className="inline mr-2" /> Start Camera
                    </button>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="mt-2 text-center text-green-600 text-sm">
                  <FaSpinner className="inline animate-spin mr-1" /> Scanning...
                </div>
              )}

              {cameraError && (
                <button onClick={startCamera} className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Retry Camera
                </button>
              )}

              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 text-center">
                  Camera stays ON - Scan multiple items continuously
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