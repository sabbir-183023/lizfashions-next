// app/api/v1/admin/accounting/expense/[id]/route.js
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import Expense from "@/app/models/Expense";
import { getAuthToken, verifyToken } from "@/app/lib/authUtils";
import mongoose from "mongoose";

export async function PUT(request, { params }) {
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

    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid expense ID" },
        { status: 400 },
      );
    }

    const { expenseName, amount, date, remarks } = body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      {
        expenseName,
        amount: parseFloat(amount),
        date: new Date(date),
        remarks: remarks || "",
      },
      { new: true, runValidators: true },
    );

    if (!updatedExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Expense updated successfully",
        expense: updatedExpense,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update expense",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
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

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid expense ID" },
        { status: 400 },
      );
    }

    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Expense deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete expense",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
