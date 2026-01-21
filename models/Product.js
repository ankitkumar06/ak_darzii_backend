const mongoose = require('mongoose');
const Schema = mongoose.Schema
const productSchema = new Schema({
  id: { type: Number, required: true, unique: true }, // keep original id
  name: String,
  price: Number,
  description: String,
  fullDescription: String,
  emoji: String,
  images: [String],
  specs: [String],
  rating: Number,
  reviews: Number,
  category: String,
  whenentered: { type: Date, default: Date.now },
  whenmodified: { type: Date, default: Date.now },
  createdby: { type: Object},
  
});

module.exports = mongoose.model('Product', productSchema);