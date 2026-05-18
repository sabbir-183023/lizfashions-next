"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaEye,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage, debouncedSearch, selectedCategory]);

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
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(`/api/v1/admin/products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-50px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Products
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Manage your product catalog
            </p>
          </div>
          <button className="bg-yellow-400 text-blue-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 text-sm sm:text-base">
            <FaPlus className="text-xs sm:text-sm" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 sm:p-6 flex-shrink-0 border-b border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:w-64 relative">
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

          {/* Items Per Page */}
          <div className="sm:w-32">
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategory) && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="text-xs text-gray-500">
          Showing {products.length} of {totalItems} products
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3">
                      <div className="flex items-center gap-2">
                        {/* Eye Icon with Link to product page */}
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                          title="View product"
                        >
                          <FaEye className="w-4 h-4" />
                        </Link>
                        <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[150px] sm:max-w-none">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs text-gray-500">
                      {product.SKU}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs font-semibold text-gray-700">
                      ৳{product.sellingPrice}
                    </td>
                    <td className="px-3 sm:px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          (product.quantity || 0) > 10
                            ? "bg-green-100 text-green-700"
                            : (product.quantity || 0) > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.quantity || 0}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-xs text-gray-500">
                      {product.category || "-"}
                    </td>
                    <td className="px-3 sm:px-6 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors p-1">
                          <FaEdit className="text-xs sm:text-sm" />
                        </button>
                        <button className="text-red-600 hover:text-red-800 transition-colors p-1">
                          <FaTrash className="text-xs sm:text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <FaChevronLeft className="text-xs" /> Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-yellow-400 text-blue-900 font-semibold"
                          : "hover:bg-gray-200 text-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors flex items-center gap-1"
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

export default Products;