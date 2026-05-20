// app/blogs/[slug]/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FaCalendarAlt,
  FaTag,
  FaEye,
  FaSpinner,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaLink,
} from "react-icons/fa";
import moment from "moment";
import toast from "react-hot-toast";

// Recent Blog Card Component
const RecentBlogCard = ({ blog }) => {
  return (
    <Link href={`/blogs/${blog.slug}`}>
      <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="w-16 h-16 flex-shrink-0">
          {blog.photo?.url ? (
            <img
              src={blog.photo.url}
              alt={blog.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
              No img
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-yellow-600">
            {blog.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {moment(blog.createdAt).format("DD MMM YYYY")}
          </p>
        </div>
      </div>
    </Link>
  );
};

// Share Button Component
const ShareButtons = ({ url, title }) => {
  const shareUrl = typeof window !== "undefined" ? window.location.href : url;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Share:</span>
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 transition"
      >
        <FaFacebook className="text-lg" />
      </a>
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-500 hover:text-sky-700 transition"
      >
        <FaTwitter className="text-lg" />
      </a>
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-700 hover:text-blue-900 transition"
      >
        <FaLinkedin className="text-lg" />
      </a>
      <button
        onClick={copyToClipboard}
        className="text-gray-500 hover:text-gray-700 transition"
      >
        <FaLink className="text-lg" />
      </button>
    </div>
  );
};

const SingleBlogPage = () => {
  const params = useParams();
  const slug = params.slug;

  const [blog, setBlog] = useState(null);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/blogs/${slug}`);
        const data = await response.json();

        if (data.success) {
          setBlog(data.blog);
          setRecentBlogs(data.recentBlogs || []);
        } else {
          setError(data.message);
        }
      } catch (error) {
        console.error("Error fetching blog:", error);
        setError("Failed to load blog post");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-yellow-500" />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Blog Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "The blog post you're looking for doesn't exist."}
          </p>
          <Link href="/blogs">
            <button className="bg-yellow-400 text-gray-800 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition">
              Back to Blogs
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/blogs" className="text-yellow-600 hover:text-yellow-700">
            ← Back to Blogs
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* Featured Image */}
              <div className="relative h-96">
                {blog.photo?.url ? (
                  <img
                    src={blog.photo.url}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 md:p-8">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b">
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt /> {moment(blog.createdAt).format("DD MMM YYYY")}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaEye /> {blog.views} views
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {blog.title}
                </h1>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {blog.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div
                  className="prose prose-lg max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Share Section */}
                <div className="mt-8 pt-6 border-t flex flex-wrap justify-between items-center gap-4">
                  <ShareButtons url={window.location.href} title={blog.title} />
                </div>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Posts */}
            {recentBlogs.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
                  Recent Posts
                </h3>
                <div className="space-y-3">
                  {recentBlogs.map((recent) => (
                    <RecentBlogCard key={recent._id} blog={recent} />
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter Widget */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-5 text-white">
              <h3 className="text-lg font-bold mb-2">Newsletter</h3>
              <p className="text-sm mb-4 opacity-90">
                Subscribe to get latest updates
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 border border-gray-50 text-gray-700 rounded-l-lg focus:outline-none"
                />
                <button className="bg-gray-800 px-4 py-2 rounded-r-lg hover:bg-gray-900 transition">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBlogPage;