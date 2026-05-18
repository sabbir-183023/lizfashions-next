// app/cart/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/app/context/CartContext";
import Image from "next/image";
import Link from "next/link";
import toast from 'react-hot-toast';
import {
  FaTrash,
  FaPlus,
  FaMinus,
  FaTag,
  FaTruck,
  FaCheckCircle,
} from "react-icons/fa";

// Shimmer loading component
const CartShimmer = () => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    <div className="animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <div className="w-24 h-24 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Order Success Modal
const OrderSuccessModal = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 mx-4 text-center shadow-2xl animate-bounce-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle className="text-green-500 text-4xl" />
        </div>
        <h3 className="text-2xl font-bold text-[#0E2238] mb-2">
          অর্ডার সম্পন্ন হয়েছে!
        </h3>
        <p className="text-gray-600 mb-4">
          আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে। ধন্যবাদ।
        </p>
        <Link href="/products">
          <button className="bg-[#FDC700] text-[#0E2238] px-6 py-2 rounded-lg font-semibold hover:bg-[#FDC700]/90 transition">
            কেনাকাটা চালিয়ে যান
          </button>
        </Link>
      </div>
    </div>
  );
};

// District selector component with search - English & Bengali
const DistrictSelector = ({ value, onChange, error }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const districts = [
    { en: "Dhaka", bn: "ঢাকা" },
    { en: "Chittagong", bn: "চট্টগ্রাম" },
    { en: "Rajshahi", bn: "রাজশাহী" },
    { en: "Khulna", bn: "খুলনা" },
    { en: "Barishal", bn: "বরিশাল" },
    { en: "Sylhet", bn: "সিলেট" },
    { en: "Rangpur", bn: "রংপুর" },
    { en: "Mymensingh", bn: "ময়মনসিংহ" },
    { en: "Cox's Bazar", bn: "কক্সবাজার" },
    { en: "Faridpur", bn: "ফরিদপুর" },
    { en: "Gazipur", bn: "গাজীপুর" },
    { en: "Gopalganj", bn: "গোপালগঞ্জ" },
    { en: "Kishoreganj", bn: "কিশোরগঞ্জ" },
    { en: "Madaripur", bn: "মাদারীপুর" },
    { en: "Manikganj", bn: "মানিকগঞ্জ" },
    { en: "Munshiganj", bn: "মুন্সীগঞ্জ" },
    { en: "Narayanganj", bn: "নারায়ণগঞ্জ" },
    { en: "Narsingdi", bn: "নরসিংদী" },
    { en: "Rajbari", bn: "রাজবাড়ী" },
    { en: "Shariatpur", bn: "শরীয়তপুর" },
    { en: "Tangail", bn: "টাঙ্গাইল" },
    { en: "Bogura", bn: "বগুড়া" },
    { en: "Joypurhat", bn: "জয়পুরহাট" },
    { en: "Naogaon", bn: "নওগাঁ" },
    { en: "Natore", bn: "নাটোর" },
    { en: "Chapainawabganj", bn: "চাঁপাইনবাবগঞ্জ" },
    { en: "Pabna", bn: "পাবনা" },
    { en: "Sirajganj", bn: "সিরাজগঞ্জ" },
    { en: "Dinajpur", bn: "দিনাজপুর" },
    { en: "Gaibandha", bn: "গাইবান্ধা" },
    { en: "Kurigram", bn: "কুড়িগ্রাম" },
    { en: "Lalmonirhat", bn: "লালমনিরহাট" },
    { en: "Nilphamari", bn: "নীলফামারী" },
    { en: "Panchagarh", bn: "পঞ্চগড়" },
    { en: "Thakurgaon", bn: "ঠাকুরগাঁও" },
    { en: "Bandarban", bn: "বান্দরবান" },
    { en: "Brahmanbaria", bn: "ব্রাহ্মণবাড়িয়া" },
    { en: "Chandpur", bn: "চাঁদপুর" },
    { en: "Comilla", bn: "কুমিল্লা" },
    { en: "Feni", bn: "ফেনী" },
    { en: "Khagrachari", bn: "খাগড়াছড়ি" },
    { en: "Lakshmipur", bn: "লক্ষ্মীপুর" },
    { en: "Noakhali", bn: "নোয়াখালী" },
    { en: "Rangamati", bn: "রাঙ্গামাটি" },
    { en: "Bagerhat", bn: "বাগেরহাট" },
    { en: "Chuadanga", bn: "চুয়াডাঙ্গা" },
    { en: "Jashore", bn: "যশোর" },
    { en: "Jhenaidah", bn: "ঝিনাইদহ" },
    { en: "Kushtia", bn: "কুষ্টিয়া" },
    { en: "Magura", bn: "মাগুরা" },
    { en: "Meherpur", bn: "মেহেরপুর" },
    { en: "Narail", bn: "নড়াইল" },
    { en: "Satkhira", bn: "সাতক্ষীরা" },
    { en: "Barguna", bn: "বরগুনা" },
    { en: "Bhola", bn: "ভোলা" },
    { en: "Jhalokati", bn: "ঝালকাঠি" },
    { en: "Patuakhali", bn: "পটুয়াখালী" },
    { en: "Pirojpur", bn: "পিরোজপুর" },
    { en: "Habiganj", bn: "হবিগঞ্জ" },
    { en: "Moulvibazar", bn: "মৌলভীবাজার" },
    { en: "Sunamganj", bn: "সুনামগঞ্জ" },
    { en: "Netrokona", bn: "নেত্রকোণা" },
    { en: "Sherpur", bn: "শেরপুর" },
  ].sort((a, b) => a.bn.localeCompare(b.bn));

  const filteredDistricts = districts.filter(
    (district) =>
      district.bn.includes(searchTerm) ||
      district.en.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const displayValue = value
    ? districts.find((d) => d.bn === value)?.bn || value
    : "";

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        District <span className="text-sm">(জেলা)</span>{" "}
        <span className="text-red-500">*</span>
      </label>
      <div
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FDC700] focus:border-transparent cursor-pointer bg-white text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {displayValue || "জেলা নির্বাচন করুন"}
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white border-b">
            <input
              type="text"
              placeholder="জেলা অনুসন্ধান করুন / Search district..."
              className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-[#FDC700] text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {filteredDistricts.map((district) => (
            <div
              key={district.bn}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
              onClick={() => {
                onChange(district.bn);
                setIsOpen(false);
                setSearchTerm("");
              }}
            >
              <span className="font-medium">{district.bn}</span>
              <span className="text-xs text-gray-500 ml-2">
                ({district.en})
              </span>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const [quantity, setQuantity] = useState(item.selectedQuantity);

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= item.maxQuantity) {
      setQuantity(newQuantity);
      onUpdateQuantity(item._id, newQuantity);
    }
  };

  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="relative w-22 h-24 flex-shrink-0">
        {item.photos?.[0] && (
          <Image
            src={item.photos[0].url}
            alt={item.name}
            fill
            className="object-cover rounded"
          />
        )}
      </div>
      <div className="flex-1">
        <Link href={`/product/${item.slug}`}>
          <h3 className="font-semibold text-[#0E2238] hover:text-[#FDC700] transition-colors">
            {item.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-500">SKU: {item.SKU}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              className="p-1 border rounded hover:bg-gray-100 text-gray-600"
            >
              <FaMinus size={12} />
            </button>
            <span className="w-8 text-center text-gray-800">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              className="p-1 border rounded hover:bg-gray-100 text-gray-600"
            >
              <FaPlus size={12} />
            </button>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#FDC700]">৳{item.sellingPrice}</p>
            {item?.originalPrice && (
              <p className="text-sm text-gray-400 line-through">
                ৳{item.originalPrice}
              </p>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onRemove(item._id)}
        className="text-red-500 hover:text-red-700 self-start"
      >
        <FaTrash />
      </button>
    </div>
  );
};

// Main Cart Page Component
const CartPage = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  } = useCart();
  console.log(cartItems)
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    district: "",
    policeStation: "",
    address: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  useEffect(() => {
    if (customerInfo.district === "ঢাকা") {
      setDeliveryCharge(70);
    } else if (customerInfo.district) {
      setDeliveryCharge(110);
    } else {
      setDeliveryCharge(0);
    }
  }, [customerInfo.district]);

  const subtotal = getCartTotal();
  const total = subtotal + deliveryCharge - couponDiscount;

  // Check if all mandatory fields are filled
  const isFormValid = () => {
    return (
      customerInfo.name.trim() !== "" &&
      customerInfo.district !== "" &&
      customerInfo.policeStation.trim() !== "" &&
      customerInfo.address.trim() !== "" &&
      customerInfo.phone.trim() !== "" &&
      /^01[3-9]\d{8}$/.test(customerInfo.phone) &&
      cartItems.length > 0
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!customerInfo.name) newErrors.name = "অনুগ্রহ করে আপনার নাম লিখুন";
    if (!customerInfo.district)
      newErrors.district = "অনুগ্রহ করে জেলা নির্বাচন করুন";
    if (!customerInfo.policeStation)
      newErrors.policeStation = "অনুগ্রহ করে থানা/উপজেলা লিখুন";
    if (!customerInfo.address) newErrors.address = "অনুগ্রহ করে ঠিকানা লিখুন";
    if (!customerInfo.phone) newErrors.phone = "অনুগ্রহ করে ফোন নম্বর লিখুন";
    else if (!/^01[3-9]\d{8}$/.test(customerInfo.phone)) {
      newErrors.phone = "সঠিক ফোন নম্বর লিখুন (01XXXXXXXXX)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.error("কুপন কোড লিখুন");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const res = await fetch("/api/v1/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, total: subtotal }),
      });
      const data = await res.json();

      if (data.success) {
        setCouponDiscount(data.discount);
        setCouponMessage(`✅ ${data.message}`);
         toast.success(data.message);
      } else {
        setCouponDiscount(0);
        setCouponMessage(`❌ ${data.message}`);
        toast.error(data.message);
      }
    } catch (error) {
      setCouponMessage("❌ কুপন কোড যাচাই করতে সমস্যা হয়েছে");
      toast.error("কুপন কোড যাচাই করতে সমস্যা হয়েছে");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      toast.error("আপনার কার্ট খালি");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        items: cartItems,
        customer: customerInfo,
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        discount: couponDiscount,
        total: total,
        couponCode: couponDiscount > 0 ? couponCode : null,
      };

      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        // Clear cart and show success modal
        clearCart();
        setShowSuccessModal(true);
          toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে!");
        // Optional: Store order info in localStorage or state for receipt page
        localStorage.setItem("lastOrder", JSON.stringify(data.data));
      } else {
        toast.error(data.message || "অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast.error("নেটওয়ার্ক সমস্যার কারণে অর্ডার করতে পারছি না। আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  if (loading) {
    return <CartShimmer />;
  }

  if (cartItems.length === 0 && !showSuccessModal) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-lg p-8 shadow-md">
          <h2 className="text-2xl font-bold text-[#0E2238] mb-4">
            আপনার কার্ট খালি
          </h2>
          <p className="text-gray-600 mb-6">আপনার কার্টে কোন পণ্য নেই</p>
          <Link href="/products">
            <button className="bg-[#FDC700] text-[#0E2238] px-6 py-3 rounded-lg font-semibold hover:bg-[#FDC700]/90 transition">
              কেনাকাটা শুরু করুন
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Success Modal */}
      {showSuccessModal && <OrderSuccessModal onClose={handleCloseModal} />}

      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl text-center font-bold text-[#0E2238] mb-8">
          In Cart ({getCartCount()} Products)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item._id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md border">
              <h2 className="text-lg font-bold text-[#0E2238] mb-4">
                অর্ডার সংক্ষেপ
              </h2>

              <div className="space-y-3 pb-4 border-b">
                <div className="flex justify-between text-gray-700">
                  <span>পণ্যের মূল্য ({getCartCount()}টি)</span>
                  <span className="font-semibold text-gray-800">
                    ৳{subtotal}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="flex items-center gap-1">
                    <FaTruck size={14} className="text-gray-600" /> ডেলিভারি
                    চার্জ
                  </span>
                  <span className="text-gray-800">৳{deliveryCharge}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>ছাড় (কুপন)</span>
                    <span>- ৳{couponDiscount}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 font-bold text-lg">
                <span className="text-gray-800">মোট</span>
                <span className="text-[#FDC700]">৳{total}</span>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border">
              <h2 className="text-base sm:text-lg font-bold text-[#0E2238] mb-3 flex items-center gap-2">
                <FaTag className="text-[#FDC700] text-sm sm:text-base" /> কুপন
                কোড
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="কুপন কোড লিখুন"
                  className="flex-1 w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-gray-800 placeholder-gray-400"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon}
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-[#FDC700] text-[#0E2238] rounded-lg font-semibold hover:bg-[#FDC700]/90 disabled:opacity-50 whitespace-nowrap"
                >
                  {isApplyingCoupon ? "..." : "Apply"}
                </button>
              </div>
              {couponMessage && (
                <p
                  className={`text-xs sm:text-sm mt-2 ${couponMessage.includes("✅") ? "text-green-600" : "text-red-500"}`}
                >
                  {couponMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information Form */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md border">
          <h2 className="text-lg font-bold text-[#0E2238] mb-4">
            Customer's Info <span className="text-sm">(ক্রেতার তথ্য)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-sm">(সম্পূর্ণ নাম)</span>{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-gray-800 placeholder-gray-400 ${errors.name ? "border-red-500" : ""}`}
                value={customerInfo.name}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, name: e.target.value })
                }
                placeholder="আপনার সম্পূর্ণ নাম লিখুন"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone No. <span className="text-sm">(ফোন নম্বর)</span>{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-gray-800 placeholder-gray-400 ${errors.phone ? "border-red-500" : ""}`}
                value={customerInfo.phone}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, phone: e.target.value })
                }
                placeholder="01XXXXXXXXX"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <DistrictSelector
              value={customerInfo.district}
              onChange={(district) =>
                setCustomerInfo({ ...customerInfo, district })
              }
              error={errors.district}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thana/Upazilla{" "}
                <span className="text-sm">(থানা বা উপজেলার নাম)</span>{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-gray-800 placeholder-gray-400 ${errors.policeStation ? "border-red-500" : ""}`}
                value={customerInfo.policeStation}
                onChange={(e) =>
                  setCustomerInfo({
                    ...customerInfo,
                    policeStation: e.target.value,
                  })
                }
                placeholder="থানা বা উপজেলার নাম"
              />
              {errors.policeStation && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.policeStation}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address <span className="text-sm">(সম্পূর্ণ ঠিকানা)</span>{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-gray-800 placeholder-gray-400 ${errors.address ? "border-red-500" : ""}`}
                rows="2"
                value={customerInfo.address}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, address: e.target.value })
                }
                placeholder="বাড়ির নম্বর, রাস্তা, এলাকা"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ইমেইল (Optional)
              </label>
              <input
                type="email"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FDC700] focus:border-transparent text-gray-800 placeholder-gray-400"
                value={customerInfo.email}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, email: e.target.value })
                }
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handlePlaceOrder}
            disabled={!isFormValid() || isSubmitting}
            className={`bg-[#FDC700] text-[#0E2238] px-8 py-3 rounded-lg font-bold text-lg transition-all duration-300 ${
              !isFormValid() || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#FDC700]/90 hover:scale-105 cursor-pointer"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-[#0E2238] border-t-transparent rounded-full animate-spin"></div>
                প্রক্রিয়াকরণে...
              </div>
            ) : (
              "অর্ডার সম্পন্ন করুন"
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
};

export default CartPage;
