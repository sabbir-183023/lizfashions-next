// app/product/[slug]/page.jsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  FaShoppingCart, 
  FaRegHeart, 
  FaMinus, 
  FaPlus,
  FaExpand,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCheck
} from "react-icons/fa";
import { useCart } from "@/context/CartContext";

// Fullscreen Image Viewer Component
const FullscreenImageViewer = ({ images, currentIndex, onClose, onNavigate }) => {
  const [imgIndex, setImgIndex] = useState(currentIndex);

  useEffect(() => {
    setImgIndex(currentIndex);
  }, [currentIndex]);

  const goPrev = () => {
    const newIndex = imgIndex === 0 ? images.length - 1 : imgIndex - 1;
    setImgIndex(newIndex);
    onNavigate(newIndex);
  };

  const goNext = () => {
    const newIndex = imgIndex === images.length - 1 ? 0 : imgIndex + 1;
    setImgIndex(newIndex);
    onNavigate(newIndex);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-[#FDC700] hover:text-[#0E2238] transition-colors z-10"
      >
        <FaTimes size={24} />
      </button>
      
      <button 
        onClick={goPrev}
        className="absolute left-4 text-white bg-black/50 p-3 rounded-full hover:bg-[#FDC700] hover:text-[#0E2238] transition-colors"
      >
        <FaChevronLeft size={24} />
      </button>
      
      <div className="relative w-full max-w-6xl h-[80vh] mx-4">
        <Image
          src={images[imgIndex]?.url}
          alt={`Product view ${imgIndex + 1}`}
          fill
          className="object-contain"
          priority
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {imgIndex + 1} / {images.length}
        </div>
      </div>
      
      <button 
        onClick={goNext}
        className="absolute right-4 text-white bg-black/50 p-3 rounded-full hover:bg-[#FDC700] hover:text-[#0E2238] transition-colors"
      >
        <FaChevronRight size={24} />
      </button>
    </div>
  );
};

// Product Details Main Component
const ProductDetails = () => {
  const params = useParams();
  const slug = params?.slug;
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  
  const { addToCart, isInCart, cartItems } = useCart();
  
  const THUMBNAILS_TO_SHOW = 4;
  
  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/products/${slug}`);
        const data = await res.json();
        
        if (data?.product) {
          setProduct(data.product);
          const firstImage = data.product?.photos?.[0]?.url || "";
          setSelectedImage(firstImage);
          setSelectedColor(data.product?.colors?.[0] || "");
          
          // Fetch related products
          if (data.product._id && data.product.category?._id) {
            const relatedRes = await fetch(
              `/api/v1/product/related-product/${data.product._id}/${data.product.category._id}`
            );
            const relatedData = await relatedRes.json();
            setRelatedProducts(relatedData?.products || []);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);
  
  // Calculate discount percentage
  const discountPercent = product?.originalPrice
    ? Math.floor(100 - (product.sellingPrice / product.originalPrice) * 100)
    : 0;
  
  // Thumbnail navigation
  const visibleThumbnails = product?.photos
    ? product.photos.slice(thumbnailStartIndex, thumbnailStartIndex + THUMBNAILS_TO_SHOW)
    : [];
  
  const handlePrevThumbnails = () => {
    if (thumbnailStartIndex > 0) {
      setThumbnailStartIndex(thumbnailStartIndex - 1);
    }
  };
  
  const handleNextThumbnails = () => {
    if (thumbnailStartIndex + THUMBNAILS_TO_SHOW < product?.photos?.length) {
      setThumbnailStartIndex(thumbnailStartIndex + 1);
    }
  };
  
  // Handle image selection and fullscreen
  const handleImageClick = (imageUrl, index) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };
  
  const openFullscreen = () => {
    setIsFullscreen(true);
  };
  
  const closeFullscreen = () => {
    setIsFullscreen(false);
  };
  
  const handleFullscreenNavigate = (newIndex) => {
    setCurrentImageIndex(newIndex);
  };
  
  // Quantity handlers
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };
  
  const increaseQuantity = () => {
    if (product && quantity < product.quantity) setQuantity(quantity + 1);
  };
  
  // Add to cart handler
  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    addToCart(product, quantity, selectedColor);
    setAddingToCart(false);
  };
  
  // Get cart item quantity
  const cartQuantity = isInCart(product?._id) 
    ? cartItems.find(item => item._id === product?._id)?.selectedQuantity || 0
    : 0;
  
  // Loading shimmer
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Image shimmer */}
            <div className="lg:w-1/2">
              <div className="bg-gray-200 rounded-2xl aspect-square animate-pulse"></div>
              <div className="flex gap-3 mt-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
            {/* Details shimmer */}
            <div className="lg:w-1/2 space-y-4">
              <div className="h-8 bg-gray-200 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-full w-1/2 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-full w-1/3 animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0E2238] mb-4">Product Not Found</h2>
          <Link href="/products" className="text-[#FDC700] hover:underline font-semibold">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }
  
  const isOutOfStock = product.quantity === 0;
  const isProductInCart = isInCart(product._id);
  
  return (
    <>
      {/* Fullscreen Viewer */}
      {isFullscreen && product?.photos && (
        <FullscreenImageViewer
          images={product.photos}
          currentIndex={currentImageIndex}
          onClose={closeFullscreen}
          onNavigate={handleFullscreenNavigate}
        />
      )}
      
      <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-gray-500 text-sm mb-6">
            <Link href="/" className="hover:text-[#FDC700] transition">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-[#FDC700] transition">Products</Link>
            <span className="mx-2">/</span>
            <span className="text-[#0E2238] font-medium">{product.name}</span>
          </nav>
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left Column - Images */}
            <div className="lg:w-1/2">
              {/* Main Image */}
              <div 
                className="relative bg-white rounded-2xl overflow-hidden aspect-square cursor-pointer group shadow-lg"
                onClick={openFullscreen}
              >
                {selectedImage && (
                  <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                )}
                <button 
                  className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-full text-[#0E2238] hover:bg-[#FDC700] hover:text-[#0E2238] transition-colors shadow-md"
                  onClick={(e) => { e.stopPropagation(); openFullscreen(); }}
                >
                  <FaExpand size={18} />
                </button>
              </div>
              
              {/* Thumbnails */}
              {product.photos && product.photos.length > 1 && (
                <div className="mt-4 flex items-center gap-2">
                  {thumbnailStartIndex > 0 && (
                    <button
                      onClick={handlePrevThumbnails}
                      className="p-2 bg-white rounded-full text-[#0E2238] hover:bg-[#FDC700] transition-colors shadow-md"
                    >
                      <FaChevronLeft size={16} />
                    </button>
                  )}
                  
                  <div className="flex gap-3 overflow-hidden flex-1">
                    {visibleThumbnails.map((img, idx) => {
                      const actualIndex = thumbnailStartIndex + idx;
                      return (
                        <div
                          key={actualIndex}
                          className={`relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden cursor-pointer transition-all shadow-md ${
                            selectedImage === img.url
                              ? "ring-2 ring-[#FDC700] scale-105"
                              : "ring-1 ring-gray-200 hover:ring-[#FDC700]/50"
                          }`}
                          onClick={() => handleImageClick(img.url, actualIndex)}
                        >
                          <Image
                            src={img.url}
                            alt={`Thumbnail ${actualIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {thumbnailStartIndex + THUMBNAILS_TO_SHOW < product.photos.length && (
                    <button
                      onClick={handleNextThumbnails}
                      className="p-2 bg-white rounded-full text-[#0E2238] hover:bg-[#FDC700] transition-colors shadow-md"
                    >
                      <FaChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Right Column - Product Details */}
            <div className="lg:w-1/2">
              {/* Product Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-[#0E2238] mb-2">{product.name}</h1>
              
              {/* SKU */}
              <p className="text-gray-500 text-sm mb-4">SKU: {product.SKU || "N/A"}</p>
              
              {/* Category Link */}
              {product.category && (
                <div className="mb-4">
                  <span className="text-gray-600">Category: </span>
                  <Link 
                    href={`/category/${product.category.slug}`}
                    className="text-[#FDC700] hover:underline font-semibold"
                  >
                    {product.category.name}
                  </Link>
                </div>
              )}
              
              {/* Price Section */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl md:text-4xl font-bold text-[#FDC700]">
                    ৳{product.sellingPrice?.toLocaleString()}
                  </span>
                  {product.originalPrice && product.originalPrice > product.sellingPrice && (
                    <>
                      <span className="text-gray-400 line-through text-lg">
                        ৳{product.originalPrice?.toLocaleString()}
                      </span>
                      <span className="bg-green-500 text-white text-sm px-2 py-1 rounded-full">
                        -{discountPercent}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#0E2238] mb-3">Color</h3>
                  <div className="flex gap-3 flex-wrap">
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full transition-all ${
                          selectedColor === color
                            ? "ring-2 ring-[#FDC700] ring-offset-2 scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      >
                        {selectedColor === color && (
                          <FaCheck className="text-white mx-auto text-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity Selector */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#0E2238] mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white rounded-full shadow-md">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="p-3 disabled:opacity-50 hover:bg-[#FDC700] hover:text-[#0E2238] rounded-l-full transition-colors"
                    >
                      <FaMinus size={14} />
                    </button>
                    <span className="w-12 text-center font-semibold text-[#0E2238]">{quantity}</span>
                    <button
                      onClick={increaseQuantity}
                      disabled={isOutOfStock || quantity >= product.quantity}
                      className="p-3 disabled:opacity-50 hover:bg-[#FDC700] hover:text-[#0E2238] rounded-r-full transition-colors"
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {product.quantity} items available
                  </span>
                </div>
              </div>
              
              {/* Stock Status */}
              <div className="mb-6">
                {isOutOfStock ? (
                  <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full inline-block text-sm font-semibold">
                    Out of Stock
                  </div>
                ) : (
                  <div className="bg-green-100 text-green-600 px-4 py-2 rounded-full inline-block text-sm font-semibold">
                    In Stock
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {!isOutOfStock && (
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className={`flex-1 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                      isProductInCart
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-[#FDC700] text-[#0E2238] hover:bg-[#FDC700]/90 hover:scale-105 shadow-md"
                    } disabled:opacity-70`}
                  >
                    {addingToCart ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#0E2238]/30 border-t-[#0E2238] rounded-full animate-spin"></div>
                        Adding...
                      </>
                    ) : isProductInCart ? (
                      <>
                        <FaCheck />
                        Added to Cart ({cartQuantity})
                      </>
                    ) : (
                      <>
                        <FaShoppingCart />
                        Add to Cart
                      </>
                    )}
                  </button>
                )}
                
                <button className="py-4 px-6 rounded-full border-2 border-[#FDC700] text-[#FDC700] font-bold hover:bg-[#FDC700] hover:text-[#0E2238] transition-all flex items-center justify-center gap-2">
                  <FaRegHeart />
                  Wishlist
                </button>
              </div>
              
              {/* Product Description */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-xl font-semibold text-[#0E2238] mb-3">Product Details</h3>
                <div 
                  className="text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>
          </div>
          
          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-2xl md:text-3xl font-bold text-[#0E2238] mb-8 text-center">
                You May Also Like
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.slice(0, 4).map((related) => (
                  <Link 
                    href={`/product/${related.slug}`}
                    key={related._id}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    <div className="relative h-64 w-full bg-gray-100">
                      {related.photos?.[0] && (
                        <Image
                          src={related.photos[0].url}
                          alt={related.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#0E2238] font-semibold line-clamp-1">{related.name}</h3>
                      <p className="text-[#FDC700] font-bold mt-2">৳{related.sellingPrice}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetails;