// app/api/v1/admin/products/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import Product from "@/app/models/Product";
import Inventory from "@/app/models/Inventory";
import { getAuthToken, verifyToken } from "@/app/lib/authUtils";
import mongoose from "mongoose";
import slugify from "slugify";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || "dh953tr0l",
  api_key: process.env.API_KEY || "939497349613645",
  api_secret: process.env.API_SECRET || "4lYPhpHkyhySBhiulrsmLzf7Ylg",
});

// Helper to upload file to Cloudinary
const uploadToCloudinary = async (file, folder = "ProductPhotos") => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};

// Helper to delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

// GET - Fetch single product
export async function GET(request, { params }) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid product ID" }, { status: 400 });
    }

    const product = await Product.findById(id).populate("category", "name");
    
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request, { params }) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid product ID" }, { status: 400 });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const formData = await request.formData();

    // Extract form fields
    const name = formData.get("name");
    const description = formData.get("description");
    const sellingPrice = parseFloat(formData.get("sellingPrice"));
    const originalPrice = formData.get("originalPrice") ? parseFloat(formData.get("originalPrice")) : null;
    const category = formData.get("category");
    const quantity = parseInt(formData.get("quantity"));

    // Extract colors array
    const colors = [];
    let i = 0;
    while (formData.has(`colors[${i}]`)) {
      colors.push(formData.get(`colors[${i}]`));
      i++;
    }

    // Get photos to delete
    const photosToDelete = formData.getAll("photosToDelete[]");
    
    // Get existing photos that remain - Now as a single JSON string
    let remainingPhotos = [];
    const existingPhotosStr = formData.get("existingPhotos");
    if (existingPhotosStr) {
      try {
        remainingPhotos = JSON.parse(existingPhotosStr);
      } catch (e) {
        console.error("Error parsing existing photos:", e);
      }
    }
    
    // Get new photos
    const newPhotoFiles = formData.getAll("newPhotos");

    // Delete removed photos from Cloudinary
    if (photosToDelete.length > 0) {
      console.log("Deleting photos:", photosToDelete);
      await Promise.all(photosToDelete.map(publicId => deleteFromCloudinary(publicId)));
    }

    // Upload new photos to Cloudinary
    let newPhotoUploads = [];
    if (newPhotoFiles.length > 0) {
      console.log("Uploading new photos:", newPhotoFiles.length);
      newPhotoUploads = await Promise.all(
        newPhotoFiles.map(photo => uploadToCloudinary(photo, "ProductPhotos"))
      );
    }

    // Combine remaining existing photos with new uploads
    const allPhotos = [
      ...remainingPhotos,
      ...newPhotoUploads.map(upload => ({
        url: upload.secure_url,
        public_id: upload.public_id,
      })),
    ];

    console.log(`Final photos count: ${allPhotos.length} (${remainingPhotos.length} existing + ${newPhotoUploads.length} new)`);

    // Update slug if name changed
    let slug = existingProduct.slug;
    if (name !== existingProduct.name) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      slug = slugify(name, { lower: true, strict: true }) + randomNum;
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description,
        sellingPrice,
        originalPrice,
        category: new mongoose.Types.ObjectId(category),
        quantity,
        colors,
        photos: allPhotos,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request, { params }) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid product ID" }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    // Delete all photos from Cloudinary
    if (product.photos && product.photos.length > 0) {
      await Promise.all(
        product.photos.map(photo => deleteFromCloudinary(photo.public_id))
      );
    }

    // Remove linked product reference from inventory
    if (product.inventory) {
      await Inventory.findByIdAndUpdate(product.inventory, {
        $unset: { linkedProduct: 1 }
      });
    }

    // Delete product
    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    }, { status: 500 });
  }
}