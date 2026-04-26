const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  images: [{ type: String }],
  category: { type: String, required: true },
  condition: { type: String, required: true },
  location: { type: String },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerName: { type: String },
  sellerWallet: { type: String },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  buyerName: { type: String },
  isSold: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  isNewItem: { type: Boolean, default: false },
  reviews: { type: Number, default: 0 },
  trust: { type: Number, default: 70 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', listingSchema);
