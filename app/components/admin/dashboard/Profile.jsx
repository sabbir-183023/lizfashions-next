// app/admin/dashboard/components/Profile.jsx
"use client";

import React, { useState, useEffect } from "react";
import { FaSave, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import toast from "react-hot-toast";

const Profile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    country: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        district: user.district || "",
        country: user.country || "Bangladesh"
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/v1/user/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Update user context if needed
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
            <p className="text-blue-200 mt-1">Manage your account information</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6">
        {!isEditing ? (
          // View Mode
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaUser className="text-yellow-500" />
                <span className="text-sm text-gray-500">Full Name</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">{formData.name}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaEnvelope className="text-yellow-500" />
                <span className="text-sm text-gray-500">Email Address</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">{formData.email}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaPhone className="text-yellow-500" />
                <span className="text-sm text-gray-500">Phone Number</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">{formData.phone}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaMapMarkerAlt className="text-yellow-500" />
                <span className="text-sm text-gray-500">Address</span>
              </div>
              <p className="text-gray-800">{formData.address || "Not provided"}</p>
            </div>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  District
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FaSave />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;