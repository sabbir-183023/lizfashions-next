// app/models/Slide.js
import mongoose from 'mongoose';

const SlideSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  subtitle: { 
    type: String, 
    required: [true, 'Subtitle is required'],
    trim: true,
    maxlength: [200, 'Subtitle cannot exceed 200 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: { 
    type: String, 
    required: [true, 'Image URL is required'],
    validate: {
      validator: function(v) {
        return /^(https?:\/\/)/.test(v);
      },
      message: 'Image must be a valid URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'homepageslides'
});

// Add index for better query performance
SlideSchema.index({ order: 1 });
SlideSchema.index({ createdAt: -1 });
SlideSchema.index({ isActive: 1 });

// Add a method to get formatted data
SlideSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Use a consistent name for the model
const HomePageSlide = mongoose.models.HomePageSlide || mongoose.model('HomePageSlide', SlideSchema);

export default HomePageSlide;