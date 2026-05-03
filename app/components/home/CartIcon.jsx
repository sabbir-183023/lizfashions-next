"use client";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";

const CartIcon = () => {
  const { cartItems } = useCart();
  return (
    <Link href={"/cart"}>
      <>
        <FaShoppingCart className="text-xl hover:text-gray-300" />
        {cartItems?.length > 0 && (
          <span className="absolute bg-yellow-400 text-blue-900 px-1  rounded-2xl text-sm top-4 ml-[15px]">
            {cartItems?.length}
          </span>
        )}
      </>
    </Link>
  );
};

export default CartIcon;
