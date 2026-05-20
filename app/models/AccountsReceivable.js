// app/models/AccountsReceivable.js
import mongoose from "mongoose";

const accountsReceivableSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
    },
    payerName: {
      type: String,
      required: true,
    },
    payerPhone: {
      type: String,
    },
    payerAddress: {
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

const AccountsReceivable = mongoose.models.AccountsReceivables || mongoose.model("AccountsReceivables", accountsReceivableSchema);

export default AccountsReceivable;
