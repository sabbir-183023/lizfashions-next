// app/models/Expenses.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    expenseName: {
      type: String,
      required: true,
    },
    amount: {
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

const Expense = mongoose.models.Expenses || mongoose.model("Expenses", expenseSchema);

export default Expense;
