// app/models/Inventory.js (keep as is - NO CHANGES)
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  linkedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  supplier: {
    type: String,
    default: "",
  },
  barcode: {
    type: String,
    default: "",
  },
  initialQty: {
    type: Number,
    required: true,
  },
  currentQty: {
    type: Number,
    required: true,
  },
  purchaseRate: {
    type: Number,
    required: true,
  },
  CPP: {
    type: Number,
    required: true,
  },
  CFP: {
    type: Number,
    required: true,
  },
  saleRate: {
    type: Number,
    required: true,
  },
  profitPerProduct: {
    type: Number,
    required: true,
  },
});

export default mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);