const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: Number,
    name: String,
    price: Number,
    quantity: Number
  }],
  subtotal: Number,
  shipping: Number,
  tax: Number,
  total: Number,
  status: { type: String, enum: ['pending', 'cancelled', 'success'], default: 'pending' },
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    address: String,
    city: String,
    zipCode: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);