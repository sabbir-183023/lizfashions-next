// app/api/v1/admin/products/create/route.js
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
  // Convert file to buffer
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

export async function POST(request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user || user.role !== 1) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    await connectToDatabase();

    const formData = await request.formData();

    // Extract form fields
    const name = formData.get("name");
    const SKU = formData.get("SKU");
    const description = formData.get("description");
    const sellingPrice = parseFloat(formData.get("sellingPrice"));
    const originalPrice = formData.get("originalPrice")
      ? parseFloat(formData.get("originalPrice"))
      : null;
    const category = formData.get("category");
    const inventoryId = formData.get("inventory");
    const quantity = parseInt(formData.get("quantity"));

    // Extract colors array
    const colors = [];
    let i = 0;
    while (formData.has(`colors[${i}]`)) {
      colors.push(formData.get(`colors[${i}]`));
      i++;
    }

    // Extract photos
    const photos = [];
    let photoIndex = 0;
    while (formData.has(`photos`)) {
      const photo = formData.get(`photos`);
      if (photo && photo.size > 0) {
        photos.push(photo);
      }
      break; // Since multiple files come with same key, we need different approach
    }

    // Alternative: Get all files from formData
    const allPhotos = [];
    for (const pair of formData.entries()) {
      if (pair[0] === "photos") {
        allPhotos.push(pair[1]);
      }
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }
    if (!SKU) {
      return NextResponse.json(
        { success: false, message: "SKU is required" },
        { status: 400 },
      );
    }
    if (!description) {
      return NextResponse.json(
        { success: false, message: "Description is required" },
        { status: 400 },
      );
    }
    if (!sellingPrice) {
      return NextResponse.json(
        { success: false, message: "Selling price is required" },
        { status: 400 },
      );
    }
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 },
      );
    }
    if (!inventoryId) {
      return NextResponse.json(
        { success: false, message: "Inventory selection is required" },
        { status: 400 },
      );
    }
    if (!quantity) {
      return NextResponse.json(
        { success: false, message: "Quantity is required" },
        { status: 400 },
      );
    }
    if (allPhotos.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one photo is required" },
        { status: 400 },
      );
    }

    // Check if inventory exists and is not linked
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return NextResponse.json(
        { success: false, message: "Inventory not found" },
        { status: 404 },
      );
    }

    if (inventory.linkedProduct) {
      return NextResponse.json(
        {
          success: false,
          message: "This inventory item is already linked to a product",
        },
        { status: 400 },
      );
    }

    // Upload photos to Cloudinary
    const photoUploads = await Promise.all(
      allPhotos.map((photo) => uploadToCloudinary(photo, "ProductPhotos")),
    );

    const productPhotos = photoUploads.map((upload) => ({
      url: upload.secure_url,
      public_id: upload.public_id,
    }));

    // Generate unique slug
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const slug = slugify(name, { lower: true, strict: true }) + randomNum;

    // Create product
    const product = await Product.create({
      name,
      SKU,
      slug,
      description,
      sellingPrice,
      originalPrice,
      category: new mongoose.Types.ObjectId(category),
      inventory: new mongoose.Types.ObjectId(inventoryId),
      quantity,
      photos: productPhotos,
      colors,
    });

    // Update inventory with linked product
    await Inventory.findByIdAndUpdate(inventoryId, {
      linkedProduct: product._id,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        product,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create product",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
