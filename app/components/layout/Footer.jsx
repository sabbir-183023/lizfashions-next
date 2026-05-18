// app/components/layout/Footer.jsx
import Image from "next/image";
import Link from "next/link";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTruck,
  FaShieldAlt,
  FaUndo,
  FaHeadset,
  FaLock,
} from "react-icons/fa";
import Logo from "../../../public/LiZFashions.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-blue-900 text-white mt-auto">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 - Brand Info */}
          <div>
            <div className="flex items-center mb-4">
              <Image
                src={Logo}
                alt="logo"
                height={50}
                width={50}
                className="bg-white rounded"
              />
              <span className="ml-2 text-white font-semibold text-xl">
                LiZ Fashions
              </span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Your premier destination for trendy and quality fashion. We bring
              you the latest styles at affordable prices.
            </p>
            <div className="flex space-x-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-800 p-2 rounded-full hover:bg-yellow-400 hover:text-blue-900 transition-colors duration-300"
              >
                <FaFacebook className="text-xl" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-800 p-2 rounded-full hover:bg-yellow-400 hover:text-blue-900 transition-colors duration-300"
              >
                <FaInstagram className="text-xl" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-800 p-2 rounded-full hover:bg-yellow-400 hover:text-blue-900 transition-colors duration-300"
              >
                <FaTwitter className="text-xl" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-800 p-2 rounded-full hover:bg-yellow-400 hover:text-blue-900 transition-colors duration-300"
              >
                <FaYoutube className="text-xl" />
              </a>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative after:absolute after:bottom-[-8px] after:left-0 after:w-12 after:h-0.5 after:bg-yellow-400">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="text-yellow-400">›</span> Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="text-yellow-400">›</span> All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="text-yellow-400">›</span> About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="text-yellow-400">›</span> Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <span className="text-yellow-400">›</span> FAQ
                </Link>
              </li>
              {/* Admin Login Link */}
              <li>
                <Link
                  href="/login"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors duration-300 flex items-center gap-2 font-semibold"
                >
                  <FaLock className="text-sm" /> Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative after:absolute after:bottom-[-8px] after:left-0 after:w-12 after:h-0.5 after:bg-yellow-400">
              Customer Service
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shipping-info"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <FaTruck /> Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <FaUndo /> Returns & Exchange
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <FaShieldAlt /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <FaShieldAlt /> Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/track-order"
                  className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <FaHeadset /> Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 relative after:absolute after:bottom-[-8px] after:left-0 after:w-12 after:h-0.5 after:bg-yellow-400">
              Get In Touch
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-gray-300">
                <FaMapMarkerAlt className="text-yellow-400 mt-1 flex-shrink-0" />
                <span className="text-sm">Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <FaPhone className="text-yellow-400" />
                <a
                  href="tel:+8801234567890"
                  className="hover:text-yellow-400 transition-colors"
                >
                  +880 1234 567890
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <FaEnvelope className="text-yellow-400" />
                <a
                  href="mailto:info@lizfashions.com"
                  className="hover:text-yellow-400 transition-colors break-all"
                >
                  info@lizfashions.com
                </a>
              </li>
            </ul>

            {/* Newsletter Signup - Fully Responsive */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2 text-white flex items-center gap-2">
                <FaEnvelope className="text-yellow-400" />
                Newsletter
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Subscribe to get special offers, new arrivals, and exclusive
                deals.
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 text-gray-800 bg-white rounded-lg border border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                />
                <button className="w-full bg-yellow-400 cursor-pointer text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2">
                  <FaEnvelope className="text-sm" />
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-blue-800 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                Cash on delivery available
              </span>
            </div>
            <div className="text-sm text-gray-400">
              © {currentYear} LiZ Fashions. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
