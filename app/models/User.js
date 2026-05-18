// app/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: '',
    },
    district: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: 'Bangladesh',
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    role: {
      type: Number,
      default: 0, // 0 = user, 1 = admin
    },
    wishList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

// Prevent password from being returned in queries by default
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;