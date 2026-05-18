// app/admin/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import Profile from "@/app/components/admin/dashboard/Profile";
import Products from "@/app/components/admin/dashboard/Products";
import Inventory from "@/app/components/admin/dashboard/Inventory";
import Accounting from "@/app/components/admin/dashboard/Accounting";
import Orders from "@/app/components/admin/dashboard/Orders";
import Services from "@/app/components/admin/dashboard/Services";
import Menu from "@/app/components/admin/dashboard/Menu";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check authentication and admin status
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role !== 1) {
        router.push("/");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!isAuthenticated || user?.role !== 1) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <Profile user={user} />;
      case "products":
        return <Products />;
      case "inventory":
        return <Inventory />;
      case "accounting":
        return <Accounting />;
      case "orders":
        return <Orders />;
      case "services":
        return <Services />;
      default:
        return <Profile user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full md:px-4 lg:px-8 xl:px-16 2xl:px-32">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-yellow-400 text-blue-900 p-2 rounded-lg shadow-lg"
        >
          {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Menu */}
        <div
          className={`
            fixed lg:relative z-40
            transform transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
            w-64 lg:w-72
            bg-blue-900 text-white
            h-screen overflow-y-auto
            shadow-xl
          `}
        >
          <Menu
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-x-auto">
          <div className="max-w-full mx-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
