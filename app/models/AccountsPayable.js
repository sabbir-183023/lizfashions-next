// app/models/AccountsPayable.js
import mongoose from "mongoose";

const accountsPayableSchema  = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    supplierName: {
      type: String,
      required: true,
    },
    supplierPhone: {
      type: String,
    },
    supplierAddress: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "unpaid",
      enum: ["unpaid", "partial", "paid", "overdue"],
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const AccountsPayable = mongoose.models.AccountsPayables || mongoose.model("AccountsPayables", accountsPayableSchema);

export default AccountsPayable;
