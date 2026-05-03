import Image from "next/image";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { FaSearch } from "react-icons/fa";
import CartIcon from "../home/CartIcon";

const Header = () => {
  
  return (
    <>
      {/* Desktop Header - visible only on md screens and up */}
      <div className="hidden md:flex items-center justify-between h-20">
        {/* LEFT */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/LiZfashions.png"
              alt="logo"
              height={60}
              width={60}
              className="bg-white rounded"
            />
            <label className="ml-2 text-white font-semibold text-lg">
              LiZ Fashions
            </label>
          </Link>
        </div>

        {/* CENTER - search */}
        <div className="flex items-center text-white">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search products..."
              className="
                bg-blue-900/50 
                text-white 
                placeholder-gray-300 
                pl-4 pr-12 py-2 
                rounded-full 
                border-2 border-transparent
                focus:border-yellow-400 
                focus:outline-none 
                focus:bg-blue-900/80
                transition-all 
                duration-300 
                w-64 
                lg:w-80
            "
            />
            <button
              className="
                absolute 
                right-0 
                top-0 
                h-full 
                px-4 
                flex 
                items-center 
                justify-center
                bg-yellow-400 
                text-blue-900 
                rounded-r-full
                hover:bg-yellow-300
                transition-colors
                duration-300
            "
            >
              <FaSearch className="text-xl" />
            </button>
          </div>
        </div>

        {/* RIGHT - Icons */}
        <div className="flex items-center space-x-4 text-white">
          <Link
            href="/"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            HOME
          </Link>
          <Link
            href="/products"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            PRODUCTS
          </Link>
          <Link
            href="/about"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            ABOUT
          </Link>
          <Link
            href="/contact"
            className="hover:text-gray-300 text-sm relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-yellow-400 after:transition-all after:duration-300 hover:after:w-full"
          >
            CONTACT
          </Link>
            <CartIcon/>
        </div>
      </div>

      {/* Mobile Header - visible only on mobile */}
      <div className="md:hidden flex items-center justify-between h-16">
        <Link href="/" className="flex items-center">
          <Image
            src="/LiZfashions.png"
            alt="logo"
            height={40}
            width={40}
            className="bg-white rounded"
          />
          <div className="relative group ml-8">
            <input
              type="text"
              placeholder="Search products..."
              className="
                bg-blue-900/50 
                text-white 
                placeholder-gray-300 
                pl-4 pr-12 py-2 
                rounded-full 
                border-2 border-transparent
                focus:border-yellow-400 
                focus:outline-none 
                focus:bg-blue-900/80
                transition-all 
                duration-300 
                w-64 
                lg:w-80
            "
            />
            <button
              className="
                absolute 
                right-0 
                top-0 
                h-full 
                px-4 
                flex 
                items-center 
                justify-center
                bg-yellow-400 
                text-blue-900 
                rounded-r-full
                hover:bg-yellow-300
                transition-colors
                duration-300
            "
            >
              <FaSearch className="text-xl" />
            </button>
          </div>
        </Link>
      </div>

      {/* Mobile Bottom Navigation - fixed at bottom on mobile only */}
      <MobileMenu />
    </>
  );
};

export default Header;
