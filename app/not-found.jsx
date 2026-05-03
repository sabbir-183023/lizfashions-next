"use client";

import Link from "next/link";
import { FaHome, FaArrowLeft } from "react-icons/fa";
import { MdOutlineErrorOutline } from "react-icons/md";

const NotFound = () => {
  return (
    <div className="min-h-screen  flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#FFD700] opacity-10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#FFD700] opacity-10 rounded-full animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFD700] opacity-5 rounded-full"></div>

      {/* Circuit Board Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, #FFD700 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-[#FFD700]/20">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Side - Animated Character */}
            <div className="flex-1 relative">
              {/* Character Container */}
              <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto">
                {/* Character Body */}
                <div className="absolute inset-0 animate-float">
                  {/* Head */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full border-4 border-white shadow-xl">
                    {/* Face */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16">
                      {/* Eyes */}
                      <div className="flex justify-between">
                        <div className="w-4 h-4 bg-[#0B1E33] rounded-full animate-blink"></div>
                        <div className="w-4 h-4 bg-[#0B1E33] rounded-full animate-blink delay-100"></div>
                      </div>
                      {/* Mouth - Surprised/Confused */}
                      <div className="w-8 h-8 border-b-4 border-[#0B1E33] rounded-full mt-2 mx-auto"></div>
                    </div>
                    {/* Question Mark above head */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl text-[#FFD700] animate-bounce">
                      ?
                    </div>
                  </div>

                  {/* Body */}
                  <div className="absolute top-28 left-1/2 transform -translate-x-1/2 w-40 h-48 bg-gradient-to-b from-[#FFD700] to-[#FFA500] rounded-t-full rounded-b-lg border-4 border-white shadow-xl">
                    {/* Arms */}
                    <div className="absolute -left-8 top-8 w-12 h-8 bg-[#FFD700] rounded-full border-4 border-white transform -rotate-12 animate-reachLeft"></div>
                    <div className="absolute -right-8 top-8 w-12 h-8 bg-[#FFD700] rounded-full border-4 border-white transform rotate-12 animate-reachRight"></div>

                    {/* Broken Wires */}
                    <div className="absolute -left-16 top-6">
                      <div className="w-12 h-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full relative">
                        <div className="absolute -right-2 -top-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="absolute -right-2 bottom-0 w-2 h-4 bg-gray-800"></div>
                      </div>
                      <div className="w-8 h-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mt-1 ml-4 transform -rotate-6"></div>
                    </div>

                    <div className="absolute -right-16 top-8">
                      <div className="w-12 h-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full relative">
                        <div className="absolute -left-2 -top-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="absolute -left-2 bottom-0 w-2 h-4 bg-gray-800"></div>
                      </div>
                      <div className="w-8 h-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mt-1 ml-2 transform rotate-6"></div>
                    </div>

                    {/* Sparks */}
                    <div className="absolute -left-12 top-4 animate-spark">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full absolute"></div>
                      <div className="w-2 h-2 bg-yellow-300 rounded-full absolute left-2 top-2 animate-ping"></div>
                    </div>
                    <div className="absolute -right-12 top-6 animate-spark delay-150">
                      <div className="w-2 h-2 bg-yellow-300 rounded-full absolute"></div>
                      <div className="w-2 h-2 bg-yellow-300 rounded-full absolute left-2 top-2 animate-ping"></div>
                    </div>
                  </div>

                  {/* Legs */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <div className="w-6 h-10 bg-[#FFD700] border-4 border-white rounded-b-lg"></div>
                    <div className="w-6 h-10 bg-[#FFD700] border-4 border-white rounded-b-lg"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Error Message */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block p-3 bg-[#FFD700]/20 rounded-full mb-6">
                <MdOutlineErrorOutline className="text-5xl text-[#FFD700]" />
              </div>

              <h1 className="text-8xl md:text-9xl font-bold text-white mb-4 animate-glitch">
                404
              </h1>

              <h2 className="text-3xl md:text-4xl font-bold text-[#FFD700] mb-4">
                Connection Broken!
              </h2>

              <p className="text-gray text-lg text-blue-950 mb-8 max-w-md mx-auto lg:mx-0">
                {
                  "Oops! Looks like this page got disconnected. The wire ends are broken, and we can't seem to find what you're looking for."
                }
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/">
                  <button className="group flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD700] text-[#0B1E33] rounded-full font-semibold hover:bg-white hover:border-2 transition-all duration-300 transform hover:scale-105">
                    <FaHome className="group-hover:rotate-12 transition-transform" />
                    Back to Home
                  </button>
                </Link>

                <button
                  onClick={() => window.history.back()}
                  className="group flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-2 border-[#FFD700] text-[#FFD700] rounded-full font-semibold hover:bg-[#FFD700] hover:text-[#0B1E33] transition-all duration-300 transform hover:scale-105"
                >
                  <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                  Go Back
                </button>
              </div>

              {/* Helpful Links */}
              <div className="mt-8 pt-8 border-t border-[#FFD700]/20">
                <p className="text-gray-400 text-sm mb-4">
                  You might want to check:
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link
                    href="/products"
                    className="text-[#c7a900] hover:text-[#0B1E33] transition-colors text-sm underline underline-offset-4"
                  >
                    Latest Products
                  </Link>
                  <Link
                    href="/blogs"
                    className="text-[#c7a900] hover:text-[#0B1E33] transition-colors text-sm underline underline-offset-4"
                  >
                    Our Blogs
                  </Link>
                  <Link
                    href="/contact"
                    className="text-[#c7a900] hover:text-[#0B1E33] transition-colors text-sm underline underline-offset-4"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes blink {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.1);
          }
        }

        @keyframes reachLeft {
          0%,
          100% {
            transform: rotate(-12deg) translateY(0);
          }
          50% {
            transform: rotate(-15deg) translateY(-5px);
          }
        }

        @keyframes reachRight {
          0%,
          100% {
            transform: rotate(12deg) translateY(0);
          }
          50% {
            transform: rotate(15deg) translateY(-5px);
          }
        }

        @keyframes glitch {
          0%,
          100% {
            transform: none;
            opacity: 1;
          }
          7% {
            transform: skew(-0.5deg, -0.9deg);
            opacity: 0.75;
          }
          10% {
            transform: none;
            opacity: 1;
          }
          27% {
            transform: none;
            opacity: 1;
          }
          30% {
            transform: skew(0.8deg, -0.1deg);
            opacity: 0.75;
          }
          35% {
            transform: none;
            opacity: 1;
          }
          52% {
            transform: none;
            opacity: 1;
          }
          55% {
            transform: skew(-1deg, 0.2deg);
            opacity: 0.75;
          }
          50% {
            transform: none;
            opacity: 1;
          }
          72% {
            transform: none;
            opacity: 1;
          }
          75% {
            transform: skew(0.4deg, 1deg);
            opacity: 0.75;
          }
          80% {
            transform: none;
            opacity: 1;
          }
          100% {
            transform: none;
            opacity: 1;
          }
        }

        @keyframes spark {
          0%,
          100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-blink {
          animation: blink 4s ease-in-out infinite;
        }

        .animate-reachLeft {
          animation: reachLeft 3s ease-in-out infinite;
        }

        .animate-reachRight {
          animation: reachRight 3s ease-in-out infinite;
        }

        .animate-glitch {
          animation: glitch 5s infinite;
          text-shadow:
            0.05em 0 0 rgba(255, 0, 0, 0.75),
            -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
            0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
        }

        .animate-spark {
          animation: spark 2s ease-in-out infinite;
        }

        .delay-100 {
          animation-delay: 100ms;
        }

        .delay-150 {
          animation-delay: 150ms;
        }

        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
