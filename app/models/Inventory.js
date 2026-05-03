// app/models/Inventory.js
import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    supplier: {
      type: String,
      default: '',
      trim: true,
    },
    barcode: {
      type: String,
      default: '',
      unique: true,
      sparse: true, // Allows multiple empty values but unique when present
      trim: true,
    },
    SKU: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    initialQty: {
      type: Number,
      required: [true, 'Initial quantity is required'],
      min: [0, 'Initial quantity cannot be negative'],
    },
    currentQty: {
      type: Number,
      required: [true, 'Current quantity is required'],
      min: [0, 'Current quantity cannot be negative'],
    },
    reservedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableQty: {
      type: Number,
      default: 0,
    },
    purchaseRate: {
      type: Number,
      required: [true, 'Purchase rate is required'],
      min: [0, 'Purchase rate cannot be negative'],
    },
    CPP: {
      type: Number, // Cost Per Product (purchase rate + additional costs)
      required: [true, 'CPP (Cost Per Product) is required'],
      min: [0, 'CPP cannot be negative'],
    },
    CFP: {
      type: Number, // Cost From Production/Supplier
      required: [true, 'CFP (Cost From Production) is required'],
      min: [0, 'CFP cannot be negative'],
    },
    saleRate: {
      type: Number,
      required: [true, 'Sale rate is required'],
      min: [0, 'Sale rate cannot be negative'],
    },
    profitPerProduct: {
      type: Number,
      required: [true, 'Profit per product is required'],
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    totalInvestment: {
      type: Number,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      default: 50,
      min: 0,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock', 'discontinued'],
      default: 'in-stock',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for total value of current stock
inventorySchema.virtual('currentStockValue').get(function() {
  return this.currentQty * this.CPP;
});

// Virtual for total value of initial stock
inventorySchema.virtual('initialStockValue').get(function() {
  return this.initialQty * this.CPP;
});

// Virtual for profit margin percentage
inventorySchema.virtual('profitMarginPercentage').get(function() {
  if (this.saleRate === 0) return 0;
  return ((this.saleRate - this.CPP) / this.saleRate) * 100;
});

// Pre-save middleware to calculate derived fields
inventorySchema.pre('save', function(next) {
  // Calculate available quantity
  this.availableQty = this.currentQty - this.reservedQty;
  
  // Calculate total profit
  const soldQty = this.initialQty - this.currentQty;
  this.totalProfit = soldQty * this.profitPerProduct;
  
  // Calculate total investment
  this.totalInvestment = this.initialQty * this.purchaseRate;
  
  // Update status based on quantity
  if (this.currentQty <= 0) {
    this.status = 'out-of-stock';
  } else if (this.currentQty <= this.reorderLevel) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  
  next();
});

// Indexes for better query performance
inventorySchema.index({ product: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ barcode: 1 });
inventorySchema.index({ SKU: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ date: -1 });
inventorySchema.index({ supplier: 1 });
inventorySchema.index({ currentQty: 1 });

// Compound indexes for common queries
inventorySchema.index({ category: 1, status: 1 });
inventorySchema.index({ product: 1, date: -1 });

// Enable virtuals for JSON output
inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);

export default Inventory;