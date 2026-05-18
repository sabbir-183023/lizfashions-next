// app/models/Accounts.js
import mongoose from "mongoose";

const accountsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  accountingEquation: {
    type: String,
    required: true,
    enum: ["Asset", "Liability", "Owner's Equity"],
  },
  defaultAcc: {
    type: String,
    required: true,
    enum: ["Debit", "Credit"],
  },
});

const AccountsModel = mongoose.models.Accounts || mongoose.model("Accounts", accountsSchema);

export default AccountsModel;