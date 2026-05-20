// app/search/page.jsx
import { Suspense } from "react";
import SearchedProduct from "@/app/components/SearchedProduct";

export const metadata = {
  title: "Search Results - LiZ Fashions",
  description: "Search for products at LiZ Fashions",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FDC700]"></div>
    </div>}>
      <SearchedProduct />
    </Suspense>
  );
}