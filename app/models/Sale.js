// app/models/Sale.js
import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    productName: {
      type: String,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    CPP: {
      type: Number,
      required: true, //cost per product
    },
    totalDiscount: {
      type: Number,
      required: true,
    },
    totalProductsInOrder: {
      type: Number,
      default: 1,
    },
    deliveryCharge: {
      type: Number,
      required: true,
    },
    sellPrice: {
      type: Number,
      required: true,
    },
    profit: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Sale = mongoose.models.Sales || mongoose.model("Sales", saleSchema);

export default Sale;
