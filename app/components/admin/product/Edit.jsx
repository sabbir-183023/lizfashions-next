// app/components/admin/product/Edit.jsx
"use client";

import React, { useState, useEffect } from "react";
import {
  FaCloudUploadAlt,
  FaTrash,
  FaPlus,
  FaSpinner,
  FaSave,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";
import { Editor } from "@tinymce/tinymce-react";
import Select from "react-select";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Simple image resize utility without blob issues
const resizeImage = (file, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, { type: file.type });
              resolve(resizedFile);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          file.type,
          0.8
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const EditProduct = ({ productId, onBack }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    SKU: "",
    description: "",
    originalPrice: "",
    sellingPrice: "",
    category: "",
    quantity: "",
    colors: [],
  });

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [editorContent, setEditorContent] = useState("");

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/v1/admin/products/${productId}`);
        const data = await response.json();
        if (data.success) {
          const product = data.product;
          setFormData({
            name: product.name,
            SKU: product.SKU,
            description: product.description,
            originalPrice: product.originalPrice || "",
            sellingPrice: product.sellingPrice,
            category: product.category?._id || product.category,
            quantity: product.quantity,
            colors: product.colors || [],
          });
          setEditorContent(product.description);
          setExistingPhotos(product.photos || []);
        } else {
          toast.error(data.message || "Failed to fetch product");
          onBack();
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to fetch product");
        onBack();
      } finally {
        setFetchLoading(false);
      }
    };
    
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/v1/categories");
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      newPhotoPreviews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [newPhotoPreviews]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle color management
  const handleAddColor = () => {
    if (colorInput && !formData.colors.includes(colorInput)) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, colorInput]
      }));
      setColorInput("");
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== colorToRemove)
    }));
  };

  // Handle image upload - simplified
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Create preview URLs immediately (before resize for faster feedback)
    const previews = files.map(file => URL.createObjectURL(file));
    setNewPhotoPreviews(prev => [...prev, ...previews]);
    
    // Store the original files
    setNewPhotos(prev => [...prev, ...files]);
    
    toast.success(`${files.length} image(s) added`);
    
    // Clear the input value
    event.target.value = '';
  };

  const removeExistingPhoto = (index, publicId) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    if (publicId) {
      setPhotosToDelete(prev => [...prev, publicId]);
    }
  };

  const removeNewPhoto = (index) => {
    // Revoke the object URL to avoid memory leaks
    if (newPhotoPreviews[index]) {
      URL.revokeObjectURL(newPhotoPreviews[index]);
    }
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // app/components/admin/product/Edit.jsx - Update the handleSubmit function

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.name) {
    toast.error("Product name is required");
    return;
  }
  if (!editorContent) {
    toast.error("Description is required");
    return;
  }
  if (!formData.sellingPrice) {
    toast.error("Selling price is required");
    return;
  }
  if (!formData.category) {
    toast.error("Category is required");
    return;
  }
  if (existingPhotos.length === 0 && newPhotos.length === 0) {
    toast.error("At least one photo is required");
    return;
  }

  setLoading(true);
  
  try {
    const submitFormData = new FormData();
    submitFormData.append("name", formData.name);
    submitFormData.append("description", editorContent);
    submitFormData.append("sellingPrice", formData.sellingPrice);
    if (formData.originalPrice) submitFormData.append("originalPrice", formData.originalPrice);
    submitFormData.append("category", formData.category);
    submitFormData.append("quantity", formData.quantity);
    
    formData.colors.forEach((color, index) => {
      submitFormData.append(`colors[${index}]`, color);
    });
    
    // Add photos to delete
    photosToDelete.forEach(publicId => {
      submitFormData.append("photosToDelete[]", publicId);
    });
    
    // Add existing photos that remain - Send as JSON string
    if (existingPhotos.length > 0) {
      submitFormData.append("existingPhotos", JSON.stringify(existingPhotos));
    }
    
    // Add new photos
    for (const photo of newPhotos) {
      submitFormData.append("newPhotos", photo);
    }

    const response = await fetch(`/api/v1/admin/products/${productId}`, {
      method: "PUT",
      body: submitFormData,
    });
    
    const data = await response.json();

    if (data.success) {
      toast.success("Product updated successfully!");
      newPhotoPreviews.forEach(preview => URL.revokeObjectURL(preview));
      onBack();
    } else {
      toast.error(data.message || "Failed to update product");
    }
  } catch (error) {
    console.error("Error updating product:", error);
    toast.error("Failed to update product");
  } finally {
    setLoading(false);
  }
};

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-3xl text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Product</h1>
              <p className="text-blue-200 text-sm mt-1">Update product information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formData.SKU}
                className="w-full px-3 py-2 text-gray-500 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (Optional)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                placeholder="৳"
                min="0"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price *
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                min="0"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                min="0"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colors
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="e.g., Red, Blue, #FF5733"
                className="flex-1 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
              />
              <button
                type="button"
                onClick={handleAddColor}
                className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg hover:bg-yellow-300 flex items-center gap-2"
              >
                <FaPlus /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.colors.map((color, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 rounded-full text-sm"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {color}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(color)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <Editor
              apiKey="uesfoa9e7dbi9854pww8r021oihrhzgfomgc5ge82a1k4p8n"
              value={editorContent}
              onEditorChange={(content) => setEditorContent(content)}
              init={{
                height: 300,
                menubar: false,
                plugins: ["lists", "link", "image", "fullscreen"],
                toolbar: "bold italic | alignleft aligncenter alignright | bullist numlist | link image | fullscreen",
              }}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Photos *
            </label>
            
            {/* Existing Photos */}
            {existingPhotos.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Current Photos:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {existingPhotos.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={`Product ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(idx, photo.public_id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Photos Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FaCloudUploadAlt className="text-4xl text-gray-400" />
                <span className="text-gray-600">Add new photos</span>
                <span className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB</span>
              </label>
            </div>
            
            {/* New Photos Preview */}
            {newPhotoPreviews.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">New Photos ({newPhotoPreviews.length}):</p>
                  <button
                    type="button"
                    onClick={() => {
                      newPhotoPreviews.forEach(preview => URL.revokeObjectURL(preview));
                      setNewPhotos([]);
                      setNewPhotoPreviews([]);
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear all new photos
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {newPhotoPreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={preview}
                          alt={`New Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewPhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="bg-white pt-4 pb-2 border-t sticky bottom-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><FaSpinner className="animate-spin" /> Updating Product...</>
              ) : (
                <><FaSave /> Update Product</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;