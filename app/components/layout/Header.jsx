// app/components/Header.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import MobileMenu from "./MobileMenu";
import CartIcon from "../home/CartIcon";
import Logo from "../../../public/LiZFashions.png";

const Header = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Fetch search suggestions (only for dropdown, not for navigation)
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.trim().length < 1) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `/api/v1/search?q=${encodeURIComponent(query)}&limit=5`,
      );
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions || data.products || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced search for suggestions only
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length >= 1) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, fetchSuggestions]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (searchQuery.trim()) {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle search - only navigates when search button is clicked
  const handleSearch = () => {
    if (searchQuery.trim() && !isSearching) {
      setIsSearching(true);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
      // Don't clear search query immediately to avoid flash
      setTimeout(() => {
        setSearchQuery("");
        setSuggestions([]);
        setIsSearching(false);
      }, 100);
    }
  };

  // Handle suggestion click - navigates to product page
  const handleSuggestionClick = (product) => {
    if (!product?.slug) return;
    router.push(`/product/${product.slug}`);
    setShowSuggestions(false);
    setSearchQuery("");
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Get match type badge
  const getMatchTypeBadge = (matchType) => {
    const badges = {
      name: { text: "Product", color: "bg-blue-100 text-blue-700" },
      sku: { text: "SKU", color: "bg-purple-100 text-purple-700" },
      description: {
        text: "Description",
        color: "bg-green-100 text-green-700",
      },
      color: { text: "Color", color: "bg-pink-100 text-pink-700" },
      category: { text: "Category", color: "bg-orange-100 text-orange-700" },
      general: { text: "Match", color: "bg-gray-100 text-gray-700" },
    };
    return badges[matchType] || badges.general;
  };

  return (
    <>
      {/* Desktop Header - visible only on md screens and up */}
      <div className="hidden md:flex items-center justify-between h-20">
        {/* LEFT */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src={Logo}
              alt="logo"
              height={60}
              width={60}
              className="bg-white rounded"
            />
            <label className="ml-2 text-white font-semibold text-lg">
              LiZ Fashions
            </label>
          </Link>
        </div>

        {/* CENTER - search with suggestions */}
        <div className="flex-1 max-w-xl mx-8" ref={searchRef}>
          <div className="relative">
            <div className="relative group">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="
                  w-full
                  bg-blue-900/50 
                  text-white 
                  placeholder-gray-300 
                  pl-4 pr-24 py-2.5
                  rounded-full 
                  border-2 border-transparent
                  focus:border-yellow-400 
                  focus:outline-none 
                  focus:bg-blue-900/80
                  transition-all 
                  duration-300
              "
              />
              <div className="absolute right-0 top-0 h-full flex items-center">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="px-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="
                    px-4 
                    h-full
                    flex 
                    items-center 
                    justify-center
                    bg-yellow-400 
                    text-blue-900 
                    rounded-r-full
                    hover:bg-yellow-300
                    transition-colors
                    duration-300
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                "
                >
                  {isSearching ? (
                    <FaSpinner className="text-xl animate-spin" />
                  ) : (
                    <FaSearch className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-gray-500">
                    <FaSpinner className="animate-spin inline mr-2" />
                    Loading suggestions...
                  </div>
                ) : (
                  <>
                    {suggestions.map((product, index) => {
                      const matchType = getMatchTypeBadge(product.matchType);
                      return (
                        <div
                          key={product._id}
                          onClick={() => handleSuggestionClick(product)}
                          className={`
                            p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0
                            ${index === selectedIndex ? "bg-gray-50" : ""}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {/* Product Image */}
                            {product.thumbnail ? (
                              <div className="w-12 h-12 relative flex-shrink-0">
                                <Image
                                  src={product.thumbnail}
                                  alt={product.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                <FaSearch className="text-gray-400" />
                              </div>
                            )}

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-sm font-medium text-gray-800"
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      product.highlightedName || product.name,
                                  }}
                                />
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${matchType.color}`}
                                >
                                  {matchType.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="font-mono">
                                  SKU: {product.SKU || "N/A"}
                                </span>
                                <span className="text-green-600 font-semibold">
                                  {product.priceDisplay}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Category: {product.categoryName}
                              </div>
                              {product.colors && product.colors.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  {product.colors
                                    .slice(0, 3)
                                    .map((color, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs text-gray-400"
                                      >
                                        {color}
                                        {idx <
                                        Math.min(product.colors.length, 3) - 1
                                          ? ","
                                          : ""}
                                      </span>
                                    ))}
                                  {product.colors.length > 3 && (
                                    <span className="text-xs text-gray-400">
                                      +{product.colors.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* View All Results */}
                    {suggestions.length > 0 && (
                      <div
                        onClick={handleSearch}
                        className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center border-t border-gray-200"
                      >
                        <span className="text-sm text-blue-600 font-medium">
                          View all results for "{searchQuery}"
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT - Icons */}
        <div className="flex items-center space-x-4 text-white">
          <Link
            href="/"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            HOME
          </Link>
          <Link
            href="/products"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            PRODUCTS
          </Link>
          <Link
            href="/about"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            ABOUT
          </Link>
          <Link
            href="/contact"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            CONTACT
          </Link>
          <CartIcon />
        </div>
      </div>

      {/* Mobile Header - Logo, Search, and Cart in one row */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 px-3 h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src={Logo}
              alt="logo"
              height={40}
              width={40}
              className="bg-white rounded"
            />
          </Link>

          {/* Search Bar - Takes remaining space */}
          <div className="flex-1" ref={searchRef}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="
                  w-full
                  bg-blue-900/50 
                  text-white 
                  placeholder-gray-300 
                  text-sm
                  pl-3 pr-10 py-2
                  rounded-full 
                  border border-transparent
                  focus:border-yellow-400 
                  focus:outline-none 
                  focus:bg-blue-900/80
                  transition-all 
                  duration-300
              "
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="
                  absolute 
                  right-0 
                  top-0 
                  h-full 
                  px-3 
                  flex 
                  items-center 
                  justify-center
                  bg-yellow-400 
                  text-blue-900 
                  rounded-r-full
                  hover:bg-yellow-300
                  transition-colors
                  duration-300
                  disabled:opacity-50
                  disabled:cursor-not-allowed
              "
              >
                {isSearching ? (
                  <FaSpinner className="animate-spin text-sm" />
                ) : (
                  <FaSearch className="text-sm" />
                )}
              </button>
            </div>

            {/* Mobile Suggestions */}
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute left-3 right-3 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    <FaSpinner className="animate-spin inline mr-2" />
                    Loading...
                  </div>
                ) : (
                  <>
                    {suggestions.map((product, index) => {
                      const matchType = getMatchTypeBadge(product.matchType);
                      return (
                        <div
                          key={product._id}
                          onClick={() => handleSuggestionClick(product)}
                          className={`p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${index === selectedIndex ? "bg-gray-50" : ""}`}
                        >
                          <div className="flex items-center gap-2">
                            {product.thumbnail && (
                              <div className="w-8 h-8 relative flex-shrink-0">
                                <Image
                                  src={product.thumbnail}
                                  alt={product.name}
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium text-gray-800 truncate">
                                  {product.name}
                                </span>
                                <span
                                  className={`text-[10px] px-1 py-0.5 rounded-full ${matchType.color}`}
                                >
                                  {matchType.text}
                                </span>
                              </div>
                              <div className="text-xs text-green-600 font-semibold">
                                {product.priceDisplay}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div
                      onClick={handleSearch}
                      className="p-2 bg-gray-50 text-center text-xs text-blue-600 font-medium border-t"
                    >
                      View all results for "{searchQuery}"
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart Icon */}
          <div className="flex-shrink-0">
            <CartIcon />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileMenu />
    </>
  );
};

export default Header;