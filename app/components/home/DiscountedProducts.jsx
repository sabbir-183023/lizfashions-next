// app/components/home/DiscountedProducts.jsx
"use client";

import { useCart } from "@/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaShoppingCart, FaCheck, FaSpinner } from "react-icons/fa";

const DiscountedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  const { addToCart, isInCart, cartItems } = useCart();

  const getAllProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products/discounted`);
      const data = await res.json();
      
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.log("Error fetching discounted products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(product._id);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cartProduct = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      sellingPrice: product.sellingPrice,
      originalPrice: product.originalPrice,
      quantity: product.quantity,
      SKU: typeof product.SKU === 'string' ? parseInt(product.SKU) : product.SKU,
      photos: product.photos,
      colors: product.colors,
      inventory: "",
      category: product.category,
    };
    
    addToCart(cartProduct, 1);
    setAddingToCart(null);
  };

  const getCartItemQuantity = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    return item?.selectedQuantity || 0;
  };

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
              Discounted <span className="text-[#FFD700]">Products</span>
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
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discounted <span className="text-[#FFD700]">Products</span>
          </h2>
          <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-6"></div>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Discover products that are on sale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products && products.length > 0 ? (
            products.map((product) => {
              const inCart = isInCart(product._id);
              const cartQuantity = getCartItemQuantity(product._id);
              const isAdding = addingToCart === product._id;
              
              return (
                <div
                  key={product._id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative"
                >
                  {/* Cart Badge - Shows when item is in cart */}
                  {inCart && (
                    <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <FaCheck size={10} />
                      <span>{cartQuantity} in cart</span>
                    </div>
                  )}

                  {/* Image Container with Link */}
                  <Link href={`/product/${product?.slug}`}>
                    <div className="relative h-80 w-full overflow-hidden bg-gray-100 cursor-pointer">
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
                              <Link href={`/product/${product?.slug}`}>
                                <button
                                  className="bg-[#FFD700] text-[#0B1E33] px-6 py-2 rounded-full font-semibold hover:bg-white cursor-pointer transition-colors duration-300 transform hover:scale-105"
                                >
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
                          className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-white shadow-lg"
                          style={{ backgroundColor: product.colors[0] }}
                        ></div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-5">
                    <Link href={`/product/${product?.slug}`}>
                      <h3 className="text-lg font-bold text-[#0B1E33] mb-2 line-clamp-2 min-h-[56px] hover:text-[#FFD700] transition-colors cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-[#1A2F4A]">
                        ৳{product.sellingPrice}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-red-500 line-through">
                          ৳{product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Discount Badge */}
                    {product.originalPrice && (
                      <div className="mb-3">
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          Save {Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100)}%
                        </span>
                      </div>
                    )}

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
                          <button
                            className="w-full py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                            disabled
                          >
                            <FaCheck />
                            Added to Cart
                          </button>
                          <Link href="/cart" onClick={(e) => e.stopPropagation()}>
                            <button className="w-full py-2 rounded-xl font-semibold bg-[#FFD700] text-[#0B1E33] hover:bg-[#FFD700]/90 transition-all duration-300 text-sm cursor-pointer">
                              View Cart ({cartQuantity})
                            </button>
                          </Link>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isAdding}
                          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
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

                    {inCart && (
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        Click View Cart to manage quantity
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-white py-12">
              <p>No discounted products available at the moment.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link href={"/products"}>
            <button className="bg-transparent border-2 border-[#FFD700] text-[#FFD700] px-8 py-3 rounded-full font-semibold hover:bg-[#FFD700] hover:text-[#0B1E33] transition-all duration-300 transform hover:scale-105 cursor-pointer">
              View All Products
            </button>
          </Link>
        </div>
      </div>

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

export default DiscountedProducts;