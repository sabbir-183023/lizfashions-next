// app/components/admin/product/Create.jsx
"use client";

import React, { useState, useEffect } from "react";
import {
  FaCloudUploadAlt,
  FaTrash,
  FaPlus,
  FaSpinner,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { Editor } from "@tinymce/tinymce-react";
import Select from "react-select";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Image resize utility
const resizeImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
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
            resolve(new File([blob], file.name, { type: file.type }));
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const CreateProduct = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState(null);

  // Form state with localStorage persistence
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

  const [photos, setPhotos] = useState([]); // Store actual file objects
  const [photoPreviews, setPhotoPreviews] = useState([]); // Store preview URLs separately
  const [colorInput, setColorInput] = useState("");
  const [editorContent, setEditorContent] = useState("");

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("create_product_draft");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        setEditorContent(parsed.description || "");
        // Don't restore photos from localStorage - they need to be re-uploaded
        toast.success("Draft loaded from previous session");
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, []);

  // Save form data to localStorage on changes (excluding photos)
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const dataToSave = {
        ...formData,
        description: editorContent,
      };
      localStorage.setItem("create_product_draft", JSON.stringify(dataToSave));
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [formData, editorContent]);

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach(preview => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [photoPreviews]);

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem("create_product_draft");
    setFormData({
      name: "",
      SKU: "",
      description: "",
      originalPrice: "",
      sellingPrice: "",
      category: "",
      quantity: "",
      colors: [],
    });
    setEditorContent("");
    // Clean up preview URLs
    photoPreviews.forEach(preview => URL.revokeObjectURL(preview));
    setPhotos([]);
    setPhotoPreviews([]);
    setSelectedInventory(null);
    toast.success("Draft cleared");
  };

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

  // Fetch inventory items
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch("/api/v1/admin/inventory/available");
        const data = await response.json();
        if (data.success) {
          setInventoryItems(data.inventory);
        }
      } catch (error) {
        console.error("Failed to fetch inventory:", error);
      }
    };
    fetchInventory();
  }, []);

  // Handle inventory selection
  const handleInventoryChange = (selected) => {
    setSelectedInventory(selected);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        name: selected.productName,
        SKU: selected.barcode,
        category: selected.category?._id || selected.category,
        quantity: selected.currentQty.toString(),
        sellingPrice: selected.saleRate.toString(),
      }));
    }
  };

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

  // Handle image upload
  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const resizedFiles = await Promise.all(
        files.map(file => resizeImage(file))
      );
      
      // Store actual files
      setPhotos(prev => [...prev, ...resizedFiles]);
      
      // Create preview URLs
      const newPreviews = resizedFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
      
      toast.success(`${files.length} image(s) added`);
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("Failed to process images");
    }
  };

  const removePhoto = (index) => {
    // Clean up the preview URL
    URL.revokeObjectURL(photoPreviews[index]);
    
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      toast.error("Product name is required");
      return;
    }
    if (!formData.SKU) {
      toast.error("SKU is required");
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
    if (!selectedInventory) {
      toast.error("Please select an inventory item");
      return;
    }
    if (!formData.quantity) {
      toast.error("Quantity is required");
      return;
    }
    if (photos.length === 0) {
      toast.error("At least one photo is required");
      return;
    }

    setLoading(true);
    
    try {
      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("SKU", formData.SKU);
      submitFormData.append("description", editorContent);
      submitFormData.append("sellingPrice", formData.sellingPrice);
      if (formData.originalPrice) submitFormData.append("originalPrice", formData.originalPrice);
      submitFormData.append("category", formData.category);
      submitFormData.append("inventory", selectedInventory._id);
      submitFormData.append("quantity", formData.quantity);
      
      formData.colors.forEach((color, index) => {
        submitFormData.append(`colors[${index}]`, color);
      });
      
      photos.forEach((photo) => {
        submitFormData.append("photos", photo);
      });

      const response = await fetch("/api/v1/admin/products/create", {
        method: "POST",
        body: submitFormData,
      });
      
      const data = await response.json();

      if (data.success) {
        toast.success("Product created successfully!");
        localStorage.removeItem("create_product_draft");
        // Clean up preview URLs
        photoPreviews.forEach(preview => URL.revokeObjectURL(preview));
        clearDraft();
      } else {
        toast.error(data.message || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const inventoryOptions = inventoryItems.map(item => ({
    value: item._id,
    label: `${item.barcode} - ${item.productName}`,
    ...item
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Create New Product</h1>
            <p className="text-blue-200 text-sm mt-1">Add products from inventory</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearDraft}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FaTimes /> Clear Draft
            </button>
          </div>
        </div>
      </div>

      {/* Form Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Inventory Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select from Inventory *
            </label>
            <Select
              options={inventoryOptions}
              value={selectedInventory ? {
                value: selectedInventory._id,
                label: `${selectedInventory.barcode} - ${selectedInventory.productName}`
              } : null}
              onChange={handleInventoryChange}
              placeholder="Search and select inventory item..."
              className="react-select-container text-gray-600"
              classNamePrefix="react-select"
              isSearchable
            />
          </div>

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
                placeholder="Enter product name"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="SKU"
                value={formData.SKU}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-gray-50"
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
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                readOnly
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
                className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-gray-50"
                readOnly
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
                  className="inline-flex text-gray-600 items-center gap-2 px-3 py-1 bg-gray-200 rounded-full text-sm"
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
                <span className="text-gray-600">Click to upload images</span>
                <span className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB</span>
              </label>
            </div>
            
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {photoPreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="bg-white pt-4 pb-2 border-t">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><FaSpinner className="animate-spin" /> Creating Product...</>
              ) : (
                <><FaSave /> Create Product</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;