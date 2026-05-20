// app/components/home/LatestProducts.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/app/context/CartContext";
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
    getAllProducts(1);
  }, []);

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(product._id);

    await new Promise((resolve) => setTimeout(resolve, 500));
    addToCart(product, 1);
    setAddingToCart(null);
  };

  const getCartItemQuantity = (productId) => {
    const item = cartItems.find((item) => item._id === productId);
    return item?.selectedQuantity || 0;
  };

  const getAverageRating = (product) => {
    if (!product.reviews || product.reviews.length === 0) return null;
    const total = product.reviews.reduce(
      (sum, review) => sum + review.stars,
      0,
    );
    return (total / product.reviews.length).toFixed(1);
  };

  const ShimmerCard = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
      <div className="relative h-48 sm:h-56 md:h-64 w-full bg-gray-200"></div>
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-20"></div>
          <div className="h-7 bg-gray-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-[#0B1E33] to-[#1A2F4A]">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
              Latest <span className="text-[#FFD700]">Collection</span>
            </h2>
            <div className="w-16 sm:w-20 h-0.5 bg-[#FFD700] mx-auto"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <ShimmerCard key={item} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="my-6 sm:my-8 md:my-10 rounded-xl py-8 sm:py-12 md:py-16 bg-gradient-to-br from-[#0B1E33] to-[#1A2F4A]">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">
            Latest <span className="text-[#FFD700]">Collection</span>
          </h2>
          <div className="w-16 sm:w-20 h-0.5 bg-[#FFD700] mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl mx-auto px-4">
            Discover our newest arrivals, featuring premium quality collections
          </p>
        </div>

        {/* Products Grid - 2 columns on mobile, 3 on tablet, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products?.map((product, index) => {
            const inCart = isInCart(product._id);
            const cartQuantity = getCartItemQuantity(product._id);
            const isAdding = addingToCart === product._id;
            const averageRating = getAverageRating(product);

            return (
              <div
                key={product._id || index}
                className="group bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
              >
                {/* Cart Badge */}
                {inCart && (
                  <div className="absolute top-2 left-2 z-10 bg-green-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-0.5 shadow-lg">
                    <FaCheck size={8} className="sm:w-2 sm:h-2" />
                    <span>{cartQuantity}</span>
                  </div>
                )}

                {/* Image Container */}
                <Link href={`/product/${product?.slug}`}>
                  <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 w-full overflow-hidden bg-gray-100 cursor-pointer">
                    {product.photos && product.photos[0] && (
                      <>
                        <Image
                          src={product.photos[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          quality={60}
                          loading="lazy"
                        />
                        {/* Overlay with quick view button */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-2 left-0 right-0 text-center">
                            <Link href={`/product/${product?.slug}`}>
                              <button className="bg-[#FFD700] text-[#0B1E33] text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold hover:bg-white transition-colors duration-300">
                                Quick View
                              </button>
                            </Link>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Color indicator */}
                    {product.colors && product.colors[0] && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white shadow-lg"
                        style={{ backgroundColor: product.colors[0] }}
                      ></div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-2 sm:p-3 md:p-4">
                  <Link href={`/product/${product?.slug}`}>
                    <h3 className="text-xs sm:text-sm md:text-base font-semibold text-[#0B1E33] mb-1 line-clamp-2 min-h-[32px] sm:min-h-[40px] hover:text-[#FFD700] transition-colors cursor-pointer">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating Stars */}
                  {averageRating && (
                    <div className="flex items-center gap-0.5 mb-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${
                              star <= parseFloat(averageRating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500 ml-0.5">
                        ({product.reviews?.length || 0})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-[#1A2F4A]">
                      ৳{product.sellingPrice}
                    </span>
                    {product.originalPrice && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                        ৳{product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* SKU and Stock Status - Hidden on very small screens */}
                  <div className="hidden sm:flex items-center justify-between text-[10px] sm:text-xs mb-2 sm:mb-3">
                    <span className="text-gray-500 truncate max-w-[80px]">
                      SKU: {product.SKU}
                    </span>
                    <span
                      className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold ${
                        product.quantity > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.quantity > 0 ? "In Stock" : "Out"}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  {product.quantity > 0 ? (
                    inCart ? (
                      <div className="space-y-1 sm:space-y-2">
                        <button
                          className="w-full py-1.5 sm:py-2 rounded-lg font-semibold bg-green-600 text-white text-xs sm:text-sm flex items-center justify-center gap-1 cursor-default"
                          disabled
                        >
                          <FaCheck size={10} className="sm:w-3 sm:h-3" />
                          Added
                        </button>
                        <Link href="/cart" onClick={(e) => e.stopPropagation()}>
                          <button className="w-full py-1 sm:py-1.5 rounded-lg font-semibold bg-[#FFD700] text-[#0B1E33] text-[10px] sm:text-xs hover:bg-[#FFD700]/90 transition-all duration-300 cursor-pointer">
                            View Cart ({cartQuantity})
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={isAdding}
                        className={`w-full py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                          isAdding
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-[#0B1E33] text-white hover:bg-[#FFD700] hover:text-[#0B1E33]"
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <FaSpinner className="animate-spin w-2 h-2 sm:w-3 sm:h-3" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <FaShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <button
                      className="w-full py-1.5 sm:py-2 rounded-lg font-semibold bg-gray-300 text-gray-500 text-xs sm:text-sm cursor-not-allowed"
                      disabled
                    >
                      Sold Out
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
          <Link href={"/products"}>
            <button className="bg-transparent border border-[#FFD700] text-[#FFD700] px-5 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold hover:bg-[#FFD700] hover:text-[#0B1E33] transition-all duration-300 cursor-pointer">
              View All Products
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestProducts;