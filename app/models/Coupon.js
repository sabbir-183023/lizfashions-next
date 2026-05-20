// app/models/Coupon.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    validityStart: {
      type: Date,
      required: true,
    },
    validityEnd: {
      type: Date,
      required: true,
    },
    couponCode: {
      type: String,
      required: true,
    },
    couponQty: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    dedicatedUserPhone: {
      type: String,
    },
    isAvtive: {
      type: Boolean,
      default: true,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Coupon =
  mongoose.models.Coupons || mongoose.model("Coupons", couponSchema);

export default Coupon;
