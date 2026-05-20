// app/blogs/page.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FaSearch,
  FaCalendarAlt,
  FaTag,
  FaEye,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import moment from "moment";

// Blog Card Component
const BlogCard = ({ blog }) => {
  return (
    <Link href={`/blogs/${blog.slug}`}>
      <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
        <div className="relative h-56 overflow-hidden">
          {blog.photo?.url ? (
            <img
              src={blog.photo.url}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <FaCalendarAlt className="text-xs" />
              {moment(blog.createdAt).format("DD MMM YYYY")}
            </span>
            <span className="flex items-center gap-1">
              <FaEye className="text-xs" />
              {blog.views} views
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors">
            {blog.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-yellow-600 font-medium text-sm hover:underline">
              Read More →
            </span>
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <FaTag className="text-xs" />
                <span>{blog.tags[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Shimmer Loading Component
const BlogShimmer = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
        <div className="h-56 bg-gray-200"></div>
        <div className="p-5 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    ))}
  </div>
);

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fetch blogs
  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 6,
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/v1/blogs?${params}`);
      const data = await response.json();

      if (data.success) {
        setBlogs(data.blogs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === "" && !isSearching) {
      // If search is empty, reset to page 1 and fetch
      setCurrentPage(1);
      fetchBlogs();
    } else if (searchTerm.trim() !== "") {
      setIsSearching(true);
      setCurrentPage(1);
      fetchBlogs();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    // Fetch will trigger via useEffect when searchTerm changes
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Our Blog</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the latest trends, tips, and stories from LiZ Fashions
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-3 pl-12 pr-24 text-gray-700 border border-gray-300 rounded-full focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-24 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-yellow-400 text-gray-800 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {isSearching ? <FaSpinner className="animate-spin" /> : "Search"}
            </button>
          </div>
        </form>

        {/* Blog Grid */}
        {loading ? (
          <BlogShimmer />
        ) : blogs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600">No blogs found</h3>
            <p className="text-gray-400 mt-2">
              {searchTerm ? `No results found for "${searchTerm}"` : "Try a different search term"}
            </p>
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="mt-4 text-yellow-600 hover:text-yellow-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            {searchTerm && (
              <div className="text-center mb-6">
                <p className="text-gray-600">
                  Showing results for: <span className="font-semibold">"{searchTerm}"</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
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
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? "bg-yellow-400 text-gray-800 font-bold"
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
                  className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                  <FaChevronRight className="inline ml-1" size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlogsPage;