// app/models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    debitAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Accounts",
        required: true,
      },
    ],
    creditAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Accounts",
        required: true,
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.models.Transactions || mongoose.model("Transactions", transactionSchema);

export default Transaction;