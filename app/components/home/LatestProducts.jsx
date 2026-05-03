// app/components/home/LatestProducts.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { FaShoppingCart, FaCheck, FaSpinner, FaStar } from "react-icons/fa";

const LatestProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { addToCart, isInCart, cartItems } = useCart();

  const getAllProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products/page/${page}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.products);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.currentPage);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //eslint-disable-next-line
    getAllProducts(1);
  }, []);

  const handleAddToCart = async (product) => {
    setAddingToCart(product._id);

    // Simulate a small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    addToCart(product, 1);
    setAddingToCart(null);
  };

  // Get item quantity in cart
  const getCartItemQuantity = (productId) => {
    const item = cartItems.find((item) => item._id === productId);
    return item?.selectedQuantity || 0;
  };

  // Calculate average rating
  const getAverageRating = (product) => {
    if (!product.reviews || product.reviews.length === 0) return null;
    const total = product.reviews.reduce(
      (sum, review) => sum + review.stars,
      0
    );
    return (total / product.reviews.length).toFixed(1);
  };

  // Shimmer loading component
  const ShimmerCard = () => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
      <div className="relative h-80 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer"></div>
      <div className="p-5 space-y-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded shimmer w-3/4"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded shimmer w-1/2"></div>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded shimmer w-24"></div>
          <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full shimmer w-28"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-[#0B1E33] to-[#1A2F4A]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Latest <span className="text-[#FFD700]">Collection</span>
            </h2>
            <div className="w-24 h-1 bg-[#FFD700] mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <ShimmerCard key={item} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="my-10 rounded-xl py-16 bg-gradient-to-br from-[#0B1E33] to-[#1A2F4A]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Latest <span className="text-[#FFD700]">Collection</span>
          </h2>
          <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-6"></div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Discover our newest arrivals, featuring premium quality unstitched
            three-piece collections
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products?.map((product, index) => {
            const inCart = isInCart(product._id);
            const cartQuantity = getCartItemQuantity(product._id);
            const isAdding = addingToCart === product._id;
            const averageRating = getAverageRating(product);

            return (
              <div
                key={product._id || index}
                className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative"
              >
                {/* Cart Badge - Shows when item is in cart */}
                {inCart && (
                  <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                    <FaCheck size={10} />
                    <span>{cartQuantity} in cart</span>
                  </div>
                )}

                {/* Image Container */}
                <div className="relative h-80 w-full overflow-hidden bg-gray-100">
                  {product.photos && product.photos[0] && (
                    <>
                      <Image
                        src={product.photos[0].url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        quality={60}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
                      />
                      {/* Overlay with quick view button */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <button className="bg-[#FFD700] text-[#0B1E33] px-6 py-2 rounded-full font-semibold hover:bg-white transition-colors duration-300 transform hover:scale-105">
                            Quick View
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Color indicator */}
                  {product.colors && product.colors[0] && (
                    <div
                      className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: product.colors[0] }}
                    ></div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#0B1E33] mb-2 line-clamp-2 min-h-[56px]">
                    {product.name}
                  </h3>

                  {/* Rating Stars */}
                  {averageRating && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`w-3 h-3 ${
                              star <= parseFloat(averageRating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({product.reviews?.length || 0})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-[#1A2F4A]">
                      ৳{product.sellingPrice}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ৳{product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* SKU and Stock Status */}
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-500">SKU: {product.SKU}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.quantity > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.quantity > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {/* Add to Cart Button with multiple states */}
                  {product.quantity > 0 ? (
                    inCart ? (
                      <div className="space-y-2">
                        <button className="w-full py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2">
                          <FaCheck />
                          Added to Cart
                        </button>
                        <Link href="/cart">
                          <button className="w-full py-2 rounded-xl font-semibold bg-[#FFD700] text-[#0B1E33] hover:bg-[#FFD700]/90 transition-all duration-300 text-sm">
                            View Cart ({cartQuantity})
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isAdding}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                          isAdding
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-[#0B1E33] text-white hover:bg-[#FFD700] hover:text-[#0B1E33]"
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <FaShoppingCart />
                            Add to Cart
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <button
                      className="w-full py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
                      disabled
                    >
                      Sold Out
                    </button>
                  )}

                  {/* Quantity selector for quick add (optional) */}
                  {inCart && (
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Click View Cart to manage quantity
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href={"/products"}>
            <button className="bg-transparent border-2 border-[#FFD700] text-[#FFD700] px-8 py-3 rounded-full font-semibold hover:bg-[#FFD700] hover:text-[#0B1E33] transition-all duration-300 transform hover:scale-105">
              View All Products
            </button>
          </Link>
        </div>
      </div>

      {/* Custom CSS for shimmer effect - using regular style tag */}
      <style>
        {`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          .shimmer {
            position: relative;
            overflow: hidden;
          }

          .shimmer::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.4),
              transparent
            );
            animation: shimmer 1.5s infinite;
          }
        `}
      </style>
    </section>
  );
};

export default LatestProducts;