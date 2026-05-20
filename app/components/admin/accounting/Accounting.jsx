// app/components/admin/accounting/Accounting.jsx
"use client";

import React, { useState } from "react";
import {
  FiDollarSign,
  FiList,
  FiBarChart2,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";
import {
  FaRegHandshake,
  FaMoneyBillWave,
  FaHandHoldingUsd,
} from "react-icons/fa";
import { MdMoneyOff } from "react-icons/md";
import Sales from "./Sales";
import Expense from "./Expense";
import AccountsReceivable from "./AccountsReceivable";
import AccountsPayable from "./AccountsPayable";

const Accounting = () => {
  const [currentSubMenu, setCurrentSubMenu] = useState("Sales");
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const menuItems = [
    { id: "Sales", label: "Sales", icon: <FaRegHandshake /> },
    { id: "Expense", label: "Expense", icon: <MdMoneyOff /> },
    {
      id: "AccountsReceivable",
      label: "AccountsReceivable",
      icon: <FaMoneyBillWave />,
    },
    {
      id: "AccountsPayable",
      label: "AccountsPayable",
      icon: <FaHandHoldingUsd />,
    },
  ];

  const displayMenuItems = [...menuItems];

  const renderContent = () => {
    switch (currentSubMenu) {
      case "Sales":
        return <Sales />;
      case "Expense":
        return <Expense />;
      case "AccountsReceivable":
        return <AccountsReceivable />;
      case "AccountsPayable":
        return <AccountsPayable />;
      default:
        return <Sales />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(150vh)] md:h-[calc(120vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FiTrendingUp /> Accounting Dashboard
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Manage your financial records, transactions, and reports
            </p>
          </div>
        </div>
      </div>

      {!selectedAccountId && (
        <div className="border-b border-gray-200 px-4 sm:px-6 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-1">
            {displayMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentSubMenu(item.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                  currentSubMenu === item.id
                    ? "text-yellow-500 border-b-2 border-yellow-500"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">{renderContent()}</div>
    </div>
  );
};

export default Accounting;
