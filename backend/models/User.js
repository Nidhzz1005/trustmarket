const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  password: { type: String }, // Hashed
  walletAddress: { type: String, default: null },
  trustScore: { type: Number, default: 50 },
  isGuest: { type: Boolean, default: false },
  wishlist: [{ type: String }], // Array of listing IDs
  totalSales: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  positiveReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
