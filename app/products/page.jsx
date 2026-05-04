// app/products/page.jsx
"use client";

import { Suspense } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FaFilter,
  FaSort,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";

// Shimmer loading component for products
const ProductShimmer = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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

// Product Card Component - Mobile Optimized
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

          {product.colors && product.colors.length > 0 && (
            <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 flex gap-0.5 sm:gap-1">
              {product.colors.slice(0, 3).map((color, idx) => (
                <div
                  key={idx}
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[8px] sm:text-xs text-gray-600 bg-white/80 px-0.5 sm:px-1 rounded">
                  +{product.colors.length - 3}
                </span>
              )}
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

// Mobile Filter Drawer Component - Bottom Sheet
const MobileFilterDrawer = ({
  isOpen,
  onClose,
  onFilterChange,
  activeFilters,
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const [priceRange, setPriceRange] = useState({
    min: activeFilters.minPrice || "",
    max: activeFilters.maxPrice || "",
  });

  useEffect(() => {
    setPriceRange({
      min: activeFilters.minPrice || "",
      max: activeFilters.maxPrice || "",
    });
  }, [activeFilters.minPrice, activeFilters.maxPrice]);

  const handlePriceChange = () => {
    onFilterChange({
      minPrice: priceRange.min ? parseInt(priceRange.min) : undefined,
      maxPrice: priceRange.max ? parseInt(priceRange.max) : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#0E2238]">ফিল্টার / Filter</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MdClose size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-4 pb-6">
          {/* Categories Filter */}
          <div className="mb-6">
            <h4 className="font-semibold text-[#0E2238] mb-3 flex items-center gap-2">
              <FaFilter className="text-[#FDC700] text-sm" />
              <span>ক্যাটাগরি / Category</span>
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  onCategoryChange(null);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  selectedCategory === null
                    ? "bg-[#FDC700] text-[#0E2238] font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                সব পণ্য / All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => {
                    onCategoryChange(cat._id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    selectedCategory === cat._id
                      ? "bg-[#FDC700] text-[#0E2238] font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="mb-6">
            <h4 className="font-semibold text-[#0E2238] mb-3 flex items-center gap-2">
              <span className="text-[#FDC700] text-sm font-bold">৳</span>
              <span>দামের সীমা / Price Range</span>
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                placeholder="ন্যূনতম / Min"
                className="w-full sm:flex-1 px-3 py-2 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#FDC700] focus:border-transparent"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: e.target.value })
                }
                onBlur={handlePriceChange}
              />
              <input
                type="number"
                placeholder="সর্বোচ্চ / Max"
                className="w-full sm:flex-1 px-3 py-2 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#FDC700] focus:border-transparent"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: e.target.value })
                }
                onBlur={handlePriceChange}
              />
            </div>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setPriceRange({ min: "", max: "" });
              onFilterChange({ minPrice: undefined, maxPrice: undefined });
              onCategoryChange(null);
              onClose();
            }}
            className="w-full py-2.5 text-sm text-[#FDC700] border border-[#FDC700] rounded-lg hover:bg-[#FDC700] hover:text-[#0E2238] transition-colors"
          >
            ফিল্টার রিসেট করুন / Reset Filters
          </button>
        </div>
      </div>
    </>
  );
};

// Desktop Filter Sidebar Component
const DesktopFilterSidebar = ({
  onFilterChange,
  activeFilters,
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const [priceRange, setPriceRange] = useState({
    min: activeFilters.minPrice || "",
    max: activeFilters.maxPrice || "",
  });

  useEffect(() => {
    setPriceRange({
      min: activeFilters.minPrice || "",
      max: activeFilters.maxPrice || "",
    });
  }, [activeFilters.minPrice, activeFilters.maxPrice]);

  const handlePriceChange = () => {
    onFilterChange({
      minPrice: priceRange.min ? parseInt(priceRange.min) : undefined,
      maxPrice: priceRange.max ? parseInt(priceRange.max) : undefined,
    });
  };

  return (
    <div className="w-64 flex-shrink-0 sticky top-4">
      <div className="bg-white rounded-lg p-4 shadow-md border">
        <h3 className="text-lg font-bold text-[#0E2238] mb-4">
          ফিল্টার / Filter
        </h3>

        {/* Categories Filter */}
        <div className="mb-6">
          <h4 className="font-semibold text-[#0E2238] mb-3 flex items-center gap-2">
            <FaFilter className="text-[#FDC700] text-sm" />
            <span>ক্যাটাগরি / Category</span>
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <button
              onClick={() => onCategoryChange(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                selectedCategory === null
                  ? "bg-[#FDC700] text-[#0E2238] font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              সব পণ্য / All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => onCategoryChange(cat._id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  selectedCategory === cat._id
                    ? "bg-[#FDC700] text-[#0E2238] font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="mb-6">
          <h4 className="font-semibold text-[#0E2238] mb-3 flex items-center gap-2">
            <span className="text-[#FDC700] text-sm"> ৳</span>
            <span>দামের সীমা / Price Range</span>
          </h4>
          <div className="space-y-2">
            <input
              type="number"
              placeholder="ন্যূনতম / Min"
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#FDC700] focus:border-transparent"
              value={priceRange.min}
              onChange={(e) =>
                setPriceRange({ ...priceRange, min: e.target.value })
              }
              onBlur={handlePriceChange}
            />
            <input
              type="number"
              placeholder="সর্বোচ্চ / Max"
              className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#FDC700] focus:border-transparent"
              value={priceRange.max}
              onChange={(e) =>
                setPriceRange({ ...priceRange, max: e.target.value })
              }
              onBlur={handlePriceChange}
            />
          </div>
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => {
            setPriceRange({ min: "", max: "" });
            onFilterChange({ minPrice: undefined, maxPrice: undefined });
            onCategoryChange(null);
          }}
          className="w-full py-2 text-sm text-[#FDC700] border border-[#FDC700] rounded-lg hover:bg-[#FDC700] hover:text-[#0E2238] transition-colors"
        >
          ফিল্টার রিসেট করুন / Reset Filters
        </button>
      </div>
    </div>
  );
};

// Main Products Page Content Component (uses useSearchParams)
const ProductsPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFiltersLoaded, setIsFiltersLoaded] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    sort: "newest",
    minPrice: undefined,
    maxPrice: undefined,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 20;

  const cacheRef = useRef(new Map());

  // Load filters from URL on mount
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const sortParam = searchParams.get("sort");
    const categoryParam = searchParams.get("category");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");

    let savedFilters = null;
    try {
      const saved = sessionStorage.getItem("products_filters");
      if (saved) {
        savedFilters = JSON.parse(saved);
        if (
          savedFilters.timestamp &&
          Date.now() - savedFilters.timestamp > 3600000
        ) {
          savedFilters = null;
        }
      }
    } catch (e) {
      console.error("Error reading from sessionStorage:", e);
    }

    let newPage = 1;
    let newSort = "newest";
    let newCategory = null;
    let newMinPrice = undefined;
    let newMaxPrice = undefined;

    if (pageParam) newPage = parseInt(pageParam);
    else if (savedFilters?.page) newPage = savedFilters.page;

    if (sortParam) newSort = sortParam;
    else if (savedFilters?.sort) newSort = savedFilters.sort;

    if (categoryParam) newCategory = categoryParam;
    else if (savedFilters?.category) newCategory = savedFilters.category;

    if (minPriceParam) newMinPrice = parseInt(minPriceParam);
    else if (savedFilters?.minPrice) newMinPrice = savedFilters.minPrice;

    if (maxPriceParam) newMaxPrice = parseInt(maxPriceParam);
    else if (savedFilters?.maxPrice) newMaxPrice = savedFilters.maxPrice;

    setCurrentPage(newPage);
    setSelectedCategory(newCategory);
    setActiveFilters({
      sort: newSort,
      minPrice: newMinPrice,
      maxPrice: newMaxPrice,
    });

    setIsFiltersLoaded(true);
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/v1/categories");
        const data = await res.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products with caching
  const fetchProducts = useCallback(async () => {
    const cacheKey = `${currentPage}-${selectedCategory || "none"}-${activeFilters.sort}-${activeFilters.minPrice || "none"}-${activeFilters.maxPrice || "none"}`;

    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setProducts(cached.products);
      setTotalPages(cached.totalPages);
      setTotalProducts(cached.totalProducts);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url = `/api/v1/products?page=${currentPage}&limit=${itemsPerPage}&sort=${activeFilters.sort}`;

      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      if (activeFilters.minPrice) {
        url += `&minPrice=${activeFilters.minPrice}`;
      }
      if (activeFilters.maxPrice) {
        url += `&maxPrice=${activeFilters.maxPrice}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalProducts(data.pagination?.totalProducts || 0);

        cacheRef.current.set(cacheKey, {
          products: data.products,
          totalPages: data.pagination?.totalPages,
          totalProducts: data.pagination?.totalProducts,
        });
      } else {
        throw new Error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    selectedCategory,
    activeFilters.sort,
    activeFilters.minPrice,
    activeFilters.maxPrice,
    itemsPerPage,
  ]);

  // Only fetch products after filters are loaded
  useEffect(() => {
    if (isFiltersLoaded) {
      fetchProducts();
    }
  }, [isFiltersLoaded, fetchProducts]);

  // Update URL and sessionStorage when filters change
  const updateURLAndStorage = useCallback(
    (filters, category, page) => {
      const params = new URLSearchParams();

      if (page && page > 1) params.set("page", page);
      if (filters.sort && filters.sort !== "newest")
        params.set("sort", filters.sort);
      if (category) params.set("category", category);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

      const queryString = params.toString();
      const newUrl = queryString ? `/products?${queryString}` : "/products";

      router.replace(newUrl, { scroll: false });

      const filtersToSave = {
        page: page || 1,
        sort: filters.sort,
        category: category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        timestamp: Date.now(),
      };
      sessionStorage.setItem("products_filters", JSON.stringify(filtersToSave));
    },
    [router],
  );

  const handleSortChange = (sortValue) => {
    const newFilters = { ...activeFilters, sort: sortValue };
    setActiveFilters(newFilters);
    setCurrentPage(1);
    updateURLAndStorage(newFilters, selectedCategory, 1);
  };

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...activeFilters, ...newFilters };
    setActiveFilters(updatedFilters);
    setCurrentPage(1);
    updateURLAndStorage(updatedFilters, selectedCategory, 1);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    updateURLAndStorage(activeFilters, categoryId, 1);
  };

  const sortOptions = [
    { value: "newest", label_bn: "সর্বশেষ", label_en: "Newest" },
    {
      value: "price_asc",
      label_bn: "দাম: কম থেকে বেশি",
      label_en: "Price: Low to High",
    },
    {
      value: "price_desc",
      label_bn: "দাম: বেশি থেকে কম",
      label_en: "Price: High to Low",
    },
    { value: "name_asc", label_bn: "নাম: ক থেকে জ", label_en: "Name: A to Z" },
    { value: "name_desc", label_bn: "নাম: জ থেকে ক", label_en: "Name: Z to A" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onFilterChange={handleFilterChange}
        activeFilters={activeFilters}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0E2238] text-center">
            আমাদের পণ্য / Our Products
          </h1>
          <p className="text-center text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
            মোট {totalProducts} টি পণ্য পাওয়া গেছে / Total {totalProducts}{" "}
            products found
          </p>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border rounded-lg text-[#0E2238] hover:bg-gray-50 text-sm sm:text-base"
          >
            <FaFilter className="text-[#FDC700] text-xs sm:text-sm" />
            <span>ফিল্টার</span>
          </button>

          {/* Active Filters Display - Scrollable on mobile */}
          {(selectedCategory ||
            activeFilters.minPrice ||
            activeFilters.maxPrice) && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 overflow-x-auto pb-1">
              <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                Active:
              </span>
              {selectedCategory && (
                <span className="text-[10px] sm:text-xs bg-[#FDC700]/20 text-[#0E2238] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  {categories.find((c) => c._id === selectedCategory)?.name}
                </span>
              )}
              {activeFilters.minPrice && (
                <span className="text-[10px] sm:text-xs bg-[#FDC700]/20 text-[#0E2238] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  Min: ৳{activeFilters.minPrice}
                </span>
              )}
              {activeFilters.maxPrice && (
                <span className="text-[10px] sm:text-xs bg-[#FDC700]/20 text-[#0E2238] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  Max: ৳{activeFilters.maxPrice}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <FaSort className="text-[#FDC700] text-xs sm:text-sm" />
            <select
              value={activeFilters.sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-gray-800 bg-white focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-xs sm:text-sm md:text-base"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label_bn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-4 md:gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block">
            <DesktopFilterSidebar
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {error && (
              <div className="text-center py-8 sm:py-12">
                <p className="text-red-600 text-sm sm:text-lg">
                  Error: {error}
                </p>
                <button
                  onClick={() => fetchProducts()}
                  className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FDC700] text-[#0E2238] rounded-lg text-sm sm:text-base"
                >
                  পুনরায় চেষ্টা করুন / Retry
                </button>
              </div>
            )}

            {loading ? (
              <ProductShimmer />
            ) : !error && products.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-600 text-sm sm:text-lg">
                  কোন পণ্য পাওয়া যায়নি / No products found
                </p>
              </div>
            ) : (
              !error && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  {/* Pagination - Mobile Friendly */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8 md:mt-12 flex-wrap">
                      <button
                        onClick={() => {
                          const newPage = Math.max(1, currentPage - 1);
                          setCurrentPage(newPage);
                          updateURLAndStorage(
                            activeFilters,
                            selectedCategory,
                            newPage,
                          );
                        }}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                      >
                        <FaChevronLeft
                          className="inline mr-0.5 sm:mr-1"
                          size={10}
                        />
                        আগে
                      </button>

                      <div className="flex gap-0.5 sm:gap-1 flex-wrap justify-center">
                        {(() => {
                          const pages = [];
                          const maxVisible = 5;
                          let startPage = Math.max(
                            1,
                            currentPage - Math.floor(maxVisible / 2),
                          );
                          let endPage = Math.min(
                            totalPages,
                            startPage + maxVisible - 1,
                          );

                          if (endPage - startPage + 1 < maxVisible) {
                            startPage = Math.max(1, endPage - maxVisible + 1);
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(i);
                          }

                          return pages.map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => {
                                setCurrentPage(pageNum);
                                updateURLAndStorage(
                                  activeFilters,
                                  selectedCategory,
                                  pageNum,
                                );
                              }}
                              className={`min-w-[28px] h-7 sm:min-w-[32px] sm:h-8 md:min-w-[40px] md:h-10 rounded-lg transition-colors text-xs sm:text-sm ${
                                currentPage === pageNum
                                  ? "bg-[#FDC700] text-[#0E2238] font-bold"
                                  : "text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              {pageNum}
                            </button>
                          ));
                        })()}
                      </div>

                      <button
                        onClick={() => {
                          const newPage = Math.min(totalPages, currentPage + 1);
                          setCurrentPage(newPage);
                          updateURLAndStorage(
                            activeFilters,
                            selectedCategory,
                            newPage,
                          );
                        }}
                        disabled={currentPage === totalPages}
                        className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                      >
                        পরে
                        <FaChevronRight
                          className="inline ml-0.5 sm:ml-1"
                          size={10}
                        />
                      </button>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
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

// Main Products Page Component with Suspense boundary
const ProductsPage = () => {
  return (
    <Suspense fallback={<ProductShimmer />}>
      <ProductsPageContent />
    </Suspense>
  );
};

export default ProductsPage;