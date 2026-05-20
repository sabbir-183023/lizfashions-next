// app/components/admin/services/Slideshow.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaSave,
  FaTimes,
  FaCloudUploadAlt,
  FaToggleOn,
  FaToggleOff,
  FaArrowUp,
  FaArrowDown,
  FaImage,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Image from "next/image";

const Slideshow = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    order: 0,
    isActive: true,
  });

  // Fetch slides
  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/admin/slides");
      const data = await response.json();

      if (data.success) {
        setSlides(data.slides);
      } else {
        toast.error(data.message || "Failed to fetch slides");
      }
    } catch (error) {
      console.error("Error fetching slides:", error);
      toast.error("Failed to fetch slides");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      order: slides.length,
      isActive: true,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddSlide = async () => {
    if (!formData.title || !formData.subtitle || !formData.description || !imageFile) {
      toast.error("Please fill all fields and upload an image");
      return;
    }

    setSubmitting(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("subtitle", formData.subtitle);
      submitFormData.append("description", formData.description);
      submitFormData.append("order", formData.order);
      submitFormData.append("isActive", formData.isActive);
      submitFormData.append("image", imageFile);

      const response = await fetch("/api/v1/admin/slides", {
        method: "POST",
        body: submitFormData,
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Slide created successfully");
        setIsAddModalOpen(false);
        resetForm();
        fetchSlides();
      } else {
        toast.error(data.message || "Failed to create slide");
      }
    } catch (error) {
      console.error("Error creating slide:", error);
      toast.error("Failed to create slide");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      order: slide.order,
      isActive: slide.isActive,
    });
    setImagePreview(slide.image);
    setImageFile(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateSlide = async () => {
    if (!formData.title || !formData.subtitle || !formData.description) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("subtitle", formData.subtitle);
      submitFormData.append("description", formData.description);
      submitFormData.append("order", formData.order);
      submitFormData.append("isActive", formData.isActive);
      if (imageFile) {
        submitFormData.append("image", imageFile);
      }

      const response = await fetch(`/api/v1/admin/slides/${editingSlide._id}`, {
        method: "PUT",
        body: submitFormData,
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Slide updated successfully");
        setIsEditModalOpen(false);
        resetForm();
        fetchSlides();
      } else {
        toast.error(data.message || "Failed to update slide");
      }
    } catch (error) {
      console.error("Error updating slide:", error);
      toast.error("Failed to update slide");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlide = async (slideId, slideTitle) => {
    if (!confirm(`Are you sure you want to delete slide "${slideTitle}"?`)) {
      return;
    }

    setDeletingId(slideId);
    try {
      const response = await fetch(`/api/v1/admin/slides/${slideId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Slide deleted successfully");
        fetchSlides();
      } else {
        toast.error(data.message || "Failed to delete slide");
      }
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error("Failed to delete slide");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      const response = await fetch(`/api/v1/admin/slides/${slide._id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...slide,
          isActive: !slide.isActive,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`Slide ${!slide.isActive ? "activated" : "deactivated"}`);
        fetchSlides();
      } else {
        toast.error(data.message || "Failed to update slide status");
      }
    } catch (error) {
      console.error("Error toggling slide:", error);
      toast.error("Failed to update slide status");
    }
  };

  const handleReorder = async (slideId, newOrder) => {
    const slide = slides.find(s => s._id === slideId);
    if (!slide) return;

    try {
      const response = await fetch(`/api/v1/admin/slides/${slideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...slide,
          order: newOrder,
        }),
      });
      const data = await response.json();

      if (data.success) {
        fetchSlides();
      }
    } catch (error) {
      console.error("Error reordering slide:", error);
    }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const currentSlide = slides[index];
    const prevSlide = slides[index - 1];
    handleReorder(currentSlide._id, prevSlide.order);
    handleReorder(prevSlide._id, currentSlide.order);
  };

  const moveDown = (index) => {
    if (index === slides.length - 1) return;
    const currentSlide = slides[index];
    const nextSlide = slides[index + 1];
    handleReorder(currentSlide._id, nextSlide.order);
    handleReorder(nextSlide._id, currentSlide.order);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(129vh)] md:h-[calc(90vh)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FaImage /> Homepage Slideshow
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">
              Manage homepage slider images and content
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="bg-yellow-400 text-blue-900 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 text-sm sm:text-base"
          >
            <FaPlus /> Add New Slide
          </button>
        </div>
      </div>

      {/* Slides Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-3xl text-yellow-500" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-12">
            <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No Slides Found</h3>
            <p className="text-gray-400">Click "Add New Slide" to create your first slide</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slides.map((slide, index) => (
              <div
                key={slide._id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  {slide.image ? (
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleToggleActive(slide)}
                      className="p-1.5 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
                      title={slide.isActive ? "Deactivate" : "Activate"}
                    >
                      {slide.isActive ? (
                        <FaToggleOn className="text-green-600 text-lg" />
                      ) : (
                        <FaToggleOff className="text-gray-400 text-lg" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                      {slide.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      slide.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {slide.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1 line-clamp-1">
                    {slide.subtitle}
                  </p>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {slide.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Order: {slide.order}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                          title="Move Up"
                        >
                          <FaArrowUp className="text-xs" />
                        </button>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index === slides.length - 1}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                          title="Move Down"
                        >
                          <FaArrowDown className="text-xs" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(slide)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide._id, slide.title)}
                        disabled={deletingId === slide._id}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === slide._id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTrash />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Slide Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Add New Slide</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleAddSlide(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Slide title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Slide subtitle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Slide description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                    placeholder="Display order"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <FaCloudUploadAlt className="text-3xl text-gray-400" />
                      <span className="text-sm text-gray-600">Click to upload image</span>
                      <span className="text-xs text-gray-400">PNG, JPG, JPEG up to 5MB</span>
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaSave /> Create Slide</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slide Modal */}
      {isEditModalOpen && editingSlide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Slide</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="text-white hover:text-gray-200"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateSlide(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-yellow-400"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image (Leave empty to keep current)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label
                      htmlFor="edit-image-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <FaCloudUploadAlt className="text-3xl text-gray-400" />
                      <span className="text-sm text-gray-600">Click to change image</span>
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-yellow-400 text-blue-900 rounded-lg font-semibold hover:bg-yellow-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <><FaSpinner className="animate-spin" /> Updating...</> : <><FaSave /> Update Slide</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slideshow;