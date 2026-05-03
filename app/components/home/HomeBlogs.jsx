"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdOutlineArrowForward, MdOutlineArrowOutward } from "react-icons/md";
import moment from "moment";

// ✅ Move AnimatedSection OUTSIDE the component
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

// ✅ Move ShimmerCard OUTSIDE as well (best practice)
const ShimmerCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
    <div className="relative h-64 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shimmer"></div>
    <div className="p-6 space-y-4">
      <div className="h-7 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded shimmer w-3/4"></div>
      <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded shimmer w-1/2"></div>
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded shimmer w-1/3"></div>
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
    //eslint-disable-next-line
    getBlogs();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-[#0B1E33] to-[#1A2F4A]">
        <div className="container mx-auto px-4">
          <hr className="border-t-2 border-[#FFD700] mb-8 opacity-30" />
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
            <span className="text-[#FFD700]">Our </span>Latest Blogs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <ShimmerCard key={item} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 rounded-2xl bg-gradient-to-b from-[#0B1E33] to-[#1A2F4A] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFD700] opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFD700] opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with gold line */}
        <AnimatedSection>
          <hr className="border-t-2 border-[#FFD700] mb-8 w-24 mx-auto" />
        </AnimatedSection>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          <AnimatedSection delay={0.2}>
            <span className="text-[#FFD700]">Our </span>Latest Blogs
          </AnimatedSection>
        </h2>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs?.slice(0, 3)?.map((blog, index) => (
            <Link
              href={`/blog/${blog?.slug}`}
              key={blog?._id || index}
              className="group cursor-pointer"
            >
              <AnimatedSection delay={0.1 * (index + 1)}>
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                    {blog?.photo?.url && (
                      <>
                        <Image
                          src={blog.photo.url}
                          alt={blog?.title || "Blog post"}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E33]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </>
                    )}
                  </div>

                  {/* Details Container */}
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-[#0B1E33] mb-3 line-clamp-2 group-hover:text-[#1A2F4A] transition-colors duration-300 min-h-[56px]">
                      {blog?.title}
                    </h4>
                    
                    <p className="text-gray-500 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FFD700] rounded-full"></span>
                      {moment(blog?.createdAt).format("DD MMM, YYYY")}
                    </p>

                    {/* Read More with animated arrow */}
                    <p className="read-more inline-flex items-center gap-2 text-[#0B1E33] font-semibold group/btn">
                      <span className="relative">
                        Read More
                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FFD700] group-hover/btn:w-full transition-all duration-300"></span>
                      </span>
                      <span className="relative w-6 h-6">
                        <MdOutlineArrowForward className="absolute text-[#FFD700] text-xl transition-all duration-300 group-hover/btn:opacity-0 group-hover/btn:translate-x-2" />
                        <MdOutlineArrowOutward className="absolute text-[#FFD700] text-xl opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300" />
                      </span>
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </Link>
          ))}
        </div>

        {/* See All Blogs Button */}
        <div className="text-center mt-12">
          <AnimatedSection delay={0.5}>
            <Link href="/blogs">
              <button className="group relative px-8 py-4 bg-transparent border-2 border-[#FFD700] text-[#FFD700] rounded-full font-semibold overflow-hidden transition-all duration-300 hover:text-[#0B1E33] hover:scale-105">
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
              transform: translateY(30px);
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
        `}
      </style>
    </section>
  );
};

export default HomeBlogs;