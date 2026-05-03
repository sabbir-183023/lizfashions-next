import Image from "next/image";
import WelcomeText from "./components/home/WelcomeText";
import Slides from "./components/home/Slide";
import Link from "next/link";
import LatestProducts from "./components/home/LatestProducts";

export default function Home() {
  return (
    <div>
      <div className="isolate-slides hardware-accelerated">
        <Slides />
      </div>
      {/* Welcome text */}
      <WelcomeText/>
      {/* Social Media Section */}
      <div className="w-full rounded-3xl bg-gradient-to-r from-amber-50 to-yellow-50 py-8 sm:py-10 md:py-12 mt-8 sm:mt-12 md:mt-16 border-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
            {/* Label with decorative lines */}
            <div className="flex items-center justify-center space-x-4 w-full">
              <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-r from-transparent via-amber-300 to-amber-500" />
              <label className="text-sm sm:text-base md:text-lg lg:text-xl font-medium text-gray-700 uppercase tracking-wider">
                Visit Us On
              </label>
              <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-r from-amber-500 via-amber-300 to-transparent" />
            </div>

            {/* Social Links Container */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {/* Facebook Link */}
              <Link
                href={"https://www.facebook.com/lizfashions2025"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center space-x-2 sm:space-x-3 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg
                  className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 group-hover:text-white transition-colors duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
                </svg>
                <span className="relative z-10 text-xs sm:text-sm md:text-base font-medium text-gray-700 group-hover:text-white transition-colors duration-300">
                  Facebook
                </span>
              </Link>

              {/* Instagram Link */}
              <Link
                href={"https://www.instagram.com/liz_fashions_bd"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center space-x-2 sm:space-x-3 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg
                  className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-pink-600 group-hover:text-white transition-colors duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
                </svg>
                <span className="relative z-10 text-xs sm:text-sm md:text-base font-medium text-gray-700 group-hover:text-white transition-colors duration-300">
                  Instagram
                </span>
              </Link>

              {/* YouTube Link */}
              <Link
                href={"https://www.youtube.com/@lizfashions2025"}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center space-x-2 sm:space-x-3 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <svg
                  className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 group-hover:text-white transition-colors duration-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="relative z-10 text-xs sm:text-sm md:text-base font-medium text-gray-700 group-hover:text-white transition-colors duration-300">
                  YouTube
                </span>
              </Link>
            </div>

            {/* Optional: Hover description */}
            <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-4 text-center max-w-md px-4">
              Follow us on social media for latest updates, offers, and fashion
              inspiration!
            </p>
          </div>
        </div>
      </div>
      {/* Latest Products */}
      <LatestProducts />
    </div>
  );
}
