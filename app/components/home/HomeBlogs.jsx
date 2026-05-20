"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdOutlineArrowForward, MdOutlineArrowOutward } from "react-icons/md";
import moment from "moment";

// AnimatedSection component
const AnimatedSection = ({ children, delay = 0 }) => (
  <div
    className="opacity-0 animate-fadeInUp"
    style={{
      animation: `fadeInUp 0.6s ease-out ${delay}s forwards`,
    }}
  >
    {children}
  </div>
);

// ShimmerCard component
const ShimmerCard = () => (
  <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md animate-pulse">
    <div className="relative h-40 sm:h-48 md:h-56 w-full bg-gray-200"></div>
    <div className="p-3 sm:p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

const HomeBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const getBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/blogs/recent`);
      const data = await res.json();
      setBlogs(data.blogs);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBlogs();
  }, []);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-[#0B1E33] to-[#1A2F4A]">
        <div className="container mx-auto px-3 sm:px-4">
          <hr className="border-t border-[#FFD700] mb-6 sm:mb-8 w-16 sm:w-20 mx-auto opacity-30" />
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8 md:mb-12 text-center">
            <span className="text-[#FFD700]">Our </span>Latest Blogs
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <ShimmerCard key={item} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 rounded-xl bg-gradient-to-b from-[#0B1E33] to-[#1A2F4A] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#FFD700] opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-[#FFD700] opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-3 sm:px-4 relative z-10">
        {/* Header with gold line */}
        <AnimatedSection>
          <hr className="border-t border-[#FFD700] mb-4 sm:mb-6 w-16 sm:w-20 mx-auto" />
        </AnimatedSection>
        
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8 md:mb-12 text-center">
          <AnimatedSection delay={0.2}>
            <span className="text-[#FFD700]">Our </span>Latest Blogs
          </AnimatedSection>
        </h2>

        {/* Blogs Grid - 2 columns on mobile, 3 on tablet/desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {blogs?.slice(0, 6)?.map((blog, index) => (
            <Link
              href={`/blog/${blog?.slug}`}
              key={blog?._id || index}
              className="group cursor-pointer"
            >
              <AnimatedSection delay={0.1 * Math.min(index + 1, 3)}>
                <div className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  {/* Image Container */}
                  <div className="relative h-40 sm:h-48 md:h-52 lg:h-56 w-full overflow-hidden bg-gray-100">
                    {blog?.photo?.url && (
                      <>
                        <Image
                          src={blog.photo.url}
                          alt={blog?.title || "Blog post"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          quality={60}
                          loading="lazy"
                        />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </>
                    )}
                  </div>

                  {/* Details Container */}
                  <div className="p-2.5 sm:p-3 md:p-4">
                    <h4 className="text-xs sm:text-sm md:text-base font-bold text-[#0B1E33] mb-1.5 sm:mb-2 line-clamp-2 min-h-[32px] sm:min-h-[40px] group-hover:text-[#1A2F4A] transition-colors duration-300">
                      {blog?.title}
                    </h4>
                    
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FFD700] rounded-full"></span>
                      {moment(blog?.createdAt).format("DD MMM, YYYY")}
                    </p>

                    {/* Read More with animated arrow - Simplified for mobile */}
                    <p className="read-more inline-flex items-center gap-1 sm:gap-2 text-[#0B1E33] font-semibold text-[10px] sm:text-xs group/btn">
                      <span className="relative">
                        Read More
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] group-hover/btn:w-full transition-all duration-300"></span>
                      </span>
                      <span className="relative w-4 h-4 sm:w-5 sm:h-5">
                        <MdOutlineArrowForward className="absolute text-[#FFD700] text-sm sm:text-base transition-all duration-300 group-hover/btn:opacity-0 group-hover/btn:translate-x-1" />
                        <MdOutlineArrowOutward className="absolute text-[#FFD700] text-sm sm:text-base opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                      </span>
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </Link>
          ))}
        </div>

        {/* See All Blogs Button */}
        <div className="text-center mt-8 sm:mt-10 md:mt-12">
          <AnimatedSection delay={0.5}>
            <Link href="/blogs">
              <button className="group relative px-5 sm:px-6 md:px-8 py-2 sm:py-3 bg-transparent border border-[#FFD700] text-[#FFD700] rounded-full text-xs sm:text-sm md:text-base font-semibold overflow-hidden transition-all duration-300 hover:text-[#0B1E33] hover:scale-105">
                <span className="relative z-10">SEE ALL BLOGS</span>
                <span className="absolute inset-0 bg-[#FFD700] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </button>
            </Link>
          </AnimatedSection>
        </div>
      </div>

      {/* Add custom animations */}
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
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
            content: '';
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
          
          .animate-fadeInUp {
            animation: fadeInUp 0.6s ease-out forwards;
          }
        `}
      </style>
    </section>
  );
};

export default HomeBlogs;