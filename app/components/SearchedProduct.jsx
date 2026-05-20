// app/components/SearchedProduct.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FaFilter, FaSort, FaTimes, FaChevronLeft, FaChevronRight, FaSpinner } from "react-icons/fa";

// Product Card Component
const ProductCard = ({ product }) => {
  const [imageError, setImageError] = useState(false);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.sellingPrice
      ? Math.floor(
          ((product.originalPrice - product.sellingPrice) /
            product.originalPrice) *
            100,
        )
      : null;

  return (
    <Link href={`/product/${product.slug}`}>
      <div className="group bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.photos?.[0] && !imageError ? (
            <Image
              src={product.photos[0].url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
              No Image
            </div>
          )}

          {discountPercent && (
            <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
              -{discountPercent}%
            </div>
          )}
        </div>

        <div className="p-2 sm:p-3 md:p-4 flex-1 flex flex-col">
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-[#0E2238] line-clamp-2 min-h-[32px] sm:min-h-[40px] md:min-h-[48px] group-hover:text-[#FDC700] transition-colors">
            {product.name}
          </h3>

          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
            SKU: {product.SKU}
          </p>

          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
            <span className="text-xs sm:text-sm md:text-base font-bold text-[#FDC700]">
              ৳{product.sellingPrice?.toLocaleString()}
            </span>
            {product.originalPrice &&
              product.originalPrice > product.sellingPrice && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  ৳{product.originalPrice?.toLocaleString()}
                </span>
              )}
          </div>

          <div className="mt-1 sm:mt-2">
            {product.quantity > 0 ? (
              <span className="text-[8px] sm:text-xs text-green-600 bg-green-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full inline-block">
                In Stock
              </span>
            ) : (
              <span className="text-[8px] sm:text-xs text-red-600 bg-red-50 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full inline-block">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Shimmer loading component
const SearchShimmer = () => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div
        key={i}
        className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md animate-pulse"
      >
        <div className="relative h-40 xs:h-48 sm:h-56 md:h-64 bg-gray-200"></div>
        <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    ))}
  </div>
);

const SearchedProduct = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("q");
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("relevance");
  const [filterPrice, setFilterPrice] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  
  const itemsPerPage = 20;

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "name_asc", label: "Name: A to Z" },
    { value: "name_desc", label: "Name: Z to A" },
    { value: "newest", label: "Newest First" },
  ];

  // Fetch search results
  const fetchSearchResults = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        sort: sortBy,
      });

      if (filterPrice.min) params.append("minPrice", filterPrice.min);
      if (filterPrice.max) params.append("maxPrice", filterPrice.max);

      const response = await fetch(`/api/v1/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products || data.suggestions || []);
        setTotalResults(data.total || data.suggestions?.length || 0);
      } else {
        setError(data.message || "Failed to fetch search results");
        setProducts([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred while searching");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, sortBy, filterPrice.min, filterPrice.max]);

  useEffect(() => {
    setCurrentPage(1);
    fetchSearchResults();
  }, [searchQuery, sortBy, filterPrice.min, filterPrice.max]);

  useEffect(() => {
    fetchSearchResults();
  }, [currentPage, fetchSearchResults]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterPrice({ min: "", max: "" });
    setSortBy("relevance");
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Search Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0E2238]">
                Search Results
              </h1>
              {searchQuery && (
                <p className="text-gray-600 mt-1 text-sm">
                  Showing results for: <span className="font-semibold text-[#FDC700]">"{searchQuery}"</span>
                </p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {totalResults} {totalResults === 1 ? "product found" : "products found"}
            </div>
          </div>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-[#0E2238] hover:bg-gray-50 text-sm"
            >
              <FaFilter className="text-[#FDC700]" />
              Filters
            </button>

            {/* Active Filters */}
            {(filterPrice.min || filterPrice.max) && (
              <div className="flex items-center gap-2 flex-wrap">
                {filterPrice.min && (
                  <span className="text-xs bg-[#FDC700]/20 text-[#0E2238] px-2 py-1 rounded-full flex items-center gap-1">
                    Min: ৳{filterPrice.min}
                    <button
                      onClick={() => setFilterPrice({ ...filterPrice, min: "" })}
                      className="hover:text-red-500"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                {filterPrice.max && (
                  <span className="text-xs bg-[#FDC700]/20 text-[#0E2238] px-2 py-1 rounded-full flex items-center gap-1">
                    Max: ৳{filterPrice.max}
                    <button
                      onClick={() => setFilterPrice({ ...filterPrice, max: "" })}
                      className="hover:text-red-500"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <FaSort className="text-[#FDC700]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg text-gray-800 bg-white focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Panel - Mobile */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#0E2238]">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-6">
                  <h4 className="font-semibold text-[#0E2238] mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Min Price"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={filterPrice.min}
                      onChange={(e) => setFilterPrice({ ...filterPrice, min: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max Price"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={filterPrice.max}
                      onChange={(e) => setFilterPrice({ ...filterPrice, max: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#FDC700] text-[#0E2238] py-2 rounded-lg font-semibold"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Area */}
        {loading ? (
          <SearchShimmer />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={() => fetchSearchResults()}
              className="mt-4 px-6 py-2 bg-[#FDC700] text-[#0E2238] rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any products matching "{searchQuery}"
            </p>
            <button
              onClick={() => router.push("/products")}
              className="px-6 py-2 bg-[#FDC700] text-[#0E2238] rounded-lg font-semibold"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                >
                  <FaChevronLeft className="inline mr-1" size={12} />
                  Previous
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
                        className={`min-w-[40px] h-10 rounded-lg transition-colors text-sm ${
                          currentPage === pageNum
                            ? "bg-[#FDC700] text-[#0E2238] font-bold"
                            : "text-gray-700 hover:bg-gray-100"
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
                  className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                >
                  Next
                  <FaChevronRight className="inline ml-1" size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SearchedProduct;