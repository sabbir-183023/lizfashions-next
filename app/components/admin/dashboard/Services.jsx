// app/components/admin/dashboard/Services.jsx
"use client";

import React, { useState } from "react";
import { FaBoxOpen, FaBarcode, FaShoppingCart } from "react-icons/fa";
import CustomSales from "@/app/components/admin/services/CustomSales";
import InventoryCount from "@/app/components/admin/services/InventoryCount";

const Services = () => {
  const [activeService, setActiveService] = useState("custom-sales");

  const services = [
    { id: "custom-sales", name: "Custom Sales", icon: <FaShoppingCart /> },
    {
      id: "inventory-count",
      name: "Inventory Count",
      icon: <FaBoxOpen />,
    },
    {
      id: "wholesale",
      name: "Wholesale",
      icon: <FaBarcode />,
      comingSoon: true,
    },
  ];

  const renderService = () => {
    switch (activeService) {
      case "custom-sales":
        return <CustomSales />;
      case "inventory-count":
        return <InventoryCount />;
      case "wholesale":
        return <Wholesale />;
      default:
        return <CustomSales />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(150vh)] md:h-[calc(120vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FaBoxOpen /> Admin Services
          </h1>
          <p className="text-blue-200 text-xs sm:text-sm mt-1">
            Special services for admin operations
          </p>
        </div>
      </div>

      {/* Service Tabs */}
      <div className="border-b border-gray-200 px-4 sm:px-6 flex-shrink-0 overflow-x-auto">
        <div className="flex gap-1">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() =>
                !service.comingSoon && setActiveService(service.id)
              }
              className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeService === service.id
                  ? "text-yellow-500 border-b-2 border-yellow-500"
                  : service.comingSoon
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-500 hover:text-gray-700"
              }`}
              disabled={service.comingSoon}
              title={service.comingSoon ? "Coming Soon" : ""}
            >
              {service.icon}
              <span>{service.name}</span>
              {service.comingSoon && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Service Content */}
      <div className="flex-1 overflow-y-auto">{renderService()}</div>
    </div>
  );
};

export default Services;
