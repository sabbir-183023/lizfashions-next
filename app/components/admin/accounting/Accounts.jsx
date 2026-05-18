// app/components/admin/accounting/Accounts.jsx
"use client";

import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiEye,
  FiBriefcase,
  FiCreditCard,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Link from "next/link";

const Accounts = ({ onViewLedger }) => {
  const [name, setName] = useState("");
  const [accountingEquation, setAccountingEquation] = useState("");
  const [defaultAcc, setDefaultAcc] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [getAccLoading, setGetAccLoading] = useState(false);

  const accountingOptions = ["Asset", "Liability", "Owner's Equity"];
  const accountsDefaultAcc = ["Debit", "Credit"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setAddLoading(true);
      const response = await fetch("/api/v1/admin/accounting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accountingEquation, defaultAcc }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        getAccounts();
        setName("");
        setAccountingEquation("");
        setDefaultAcc("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error in adding account");
    } finally {
      setAddLoading(false);
    }
  };

  const getAccounts = async () => {
    try {
      setGetAccLoading(true);
      const response = await fetch("/api/v1/admin/accounting");
      const data = await response.json();
      if (data.success) {
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load accounts");
    } finally {
      setGetAccLoading(false);
    }
  };

  useEffect(() => {
    getAccounts();
  }, []);

  const getAccountTypeColor = (type) => {
    switch (type) {
      case "Asset":
        return "text-green-700 bg-green-100";
      case "Liability":
        return "text-red-700 bg-red-100";
      case "Owner's Equity":
        return "text-yellow-700 bg-yellow-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getDefaultColor = (type) => {
    return type === "Debit"
      ? "text-blue-700 bg-blue-100"
      : "text-purple-700 bg-purple-100";
  };

  return (
    <div className="space-y-6">
      {/* Add Account Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiPlus /> Add New Account
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cash, Sales Revenue"
                required
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <select
                value={accountingEquation}
                onChange={(e) => setAccountingEquation(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select Type</option>
                {accountingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Balance
              </label>
              <select
                value={defaultAcc}
                onChange={(e) => setDefaultAcc(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select Default</option>
                {accountsDefaultAcc.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={addLoading}
                className="w-full bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addLoading ? (
                  <>
                    <FiLoader className="animate-spin" /> Adding...
                  </>
                ) : (
                  <>
                    <FiPlus /> Add Account
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Accounts List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiCreditCard /> All Accounts
            <span className="ml-2 text-sm font-normal text-gray-500">
              Total: {accounts.length}{" "}
              {accounts.length === 1 ? "Account" : "Accounts"}
            </span>
          </h3>
        </div>

        {getAccLoading ? (
          <div className="flex justify-center items-center py-12">
            <FiLoader className="animate-spin text-3xl text-yellow-500" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Account Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Default Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accounts.map((account, index) => (
                  <tr key={account._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {account.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.accountingEquation)}`}
                      >
                        {account.accountingEquation}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDefaultColor(account.defaultAcc)}`}
                      >
                        {account.defaultAcc}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewLedger(account._id)}
                        className="text-blue-600 hover:text-blue-800 p-1 transition-colors inline-flex items-center gap-1"
                        title="View Ledger"
                      >
                        <FiEye /> Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiBriefcase className="text-4xl mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium">No Accounts Found</h3>
            <p className="text-sm">
              Start by creating your first accounting account
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
