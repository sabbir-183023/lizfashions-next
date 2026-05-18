// app/models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    products: [],
    payment: {},
    lastNumber: {
      type: String,
      default: "",
    },
    subTotal: {
      type: Number,
      default: 0,
    },
    customer: {
      type: Object,
      default: "",
    },
    deliveryCharge: {
      type: String,
      default: "",
    },
    defaultDiscount: {
      type: Number,
      default: 0,
    },
    customDiscount: {
      type: String,
      default: "",
    },
    couponCode: {
      type: String,
      default: "",
    },
    couponDiscount: {
      type: String,
      default: "",
    },
    courierTrackingId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Pending Confirmation",
      enum: [
        "Pending Confirmation",
        "Processing",
        "Ready to Ship",
        "In Transit",
        "Delivered",
        "Cancelled",
      ],
    },
  },
  { 
    timestamps: true 
  }
);

// Create indexes for better query performance
orderSchema.index({ buyer: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;