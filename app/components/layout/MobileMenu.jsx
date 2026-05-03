import Link from "next/link";
import { MdHome } from "react-icons/md";
import { AiFillProduct } from "react-icons/ai";
import { FaShoppingCart } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import { FaBarsProgress } from "react-icons/fa6";
import CartIcon from "../home/CartIcon";

const MobileMenu = () => {
  return (
    // Fixed bottom navigation - only visible on mobile
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-blue-900 border-t border-blue-800 shadow-lg">
      <div className="flex justify-around items-center py-3 text-white">
        <Link href="/" className="flex flex-col items-center text-xs">
          <MdHome className="text-2xl" />
          <span>Home</span>
        </Link>
        
        <Link href="/products" className="flex flex-col items-center text-xs">
          <AiFillProduct className="text-2xl" />
          <span>Products</span>
        </Link>
        
        <div className="flex flex-col items-center text-xs">
          <CartIcon/>
          <span>Cart</span>
        </div>
        
        <Link href="/menu" className="flex flex-col items-center text-xs">
          <FaBarsProgress className="text-2xl" />
          <span>Menu</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileMenu;