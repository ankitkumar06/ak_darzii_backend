const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: function(v) {
        return v >= 1 && v <= 5;
      },
      message: 'Rating must be between 1 and 5'
    }
  },
  review: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one rating per user per product
ratingSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
