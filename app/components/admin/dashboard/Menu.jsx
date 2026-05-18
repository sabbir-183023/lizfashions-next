// app/admin/dashboard/components/Menu.jsx
"use client";

import React from "react";
import Link from "next/link";
import { 
  FaUserCircle, 
  FaBoxes, 
  FaWarehouse, 
  FaChartLine, 
  FaSignOutAlt,
  FaTachometerAlt,
  FaShoppingCart,
  FaUsers,
  FaCog
} from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";

const Menu = ({ activeTab, setActiveTab, setMobileMenuOpen }) => {
  const { logout } = useAuth();

  const menuItems = [
    {
      id: "profile",
      label: "Profile",
      icon: <FaUserCircle className="w-5 h-5" />,
      description: "Manage your account"
    },
    {
      id: "products",
      label: "Products",
      icon: <FaBoxes className="w-5 h-5" />,
      description: "Manage products"
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: <FaWarehouse className="w-5 h-5" />,
      description: "Stock management"
    },
    {
      id: "accounting",
      label: "Accounting",
      icon: <FaChartLine className="w-5 h-5" />,
      description: "Financial reports"
    },
    {
      id: "orders",
      label: "Orders",
      icon: <FaShoppingCart className="w-5 h-5" />,
      description: "Manage customer orders"
    },
    {
      id: "services",
      label: "Services",
      icon: <FaCog className="w-5 h-5" />,
      description: "Manage other services"
    },
  ];

  const handleMenuClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Logo/Brand - Fixed at top */}
      <div className="flex-shrink-0 p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <FaTachometerAlt className="text-yellow-400 text-2xl" />
          <div>
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="text-xs text-gray-400">Liz Fashions Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu - Scrollable */}
      <nav className="flex-1 overflow-y-auto min-h-0 p-4 bg-blue-800">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${activeTab === item.id 
                    ? "bg-yellow-400 text-blue-900 shadow-lg" 
                    : "text-gray-300 hover:bg-blue-900 hover:text-white"
                  }
                `}
              >
                {item.icon}
                <div className="flex-1 text-left">
                  <span className="font-medium">{item.label}</span>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-blue-800 space-y-2">
        <Link href="/">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-blue-800 hover:text-white transition-colors">
            <FaShoppingCart className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <span className="font-medium">Store Front</span>
              <p className="text-xs opacity-75">View your store</p>
            </div>
          </button>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
        >
          <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
          <div className="text-left">
            <span className="font-medium">Logout</span>
            <p className="text-xs opacity-75">Sign out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Menu;