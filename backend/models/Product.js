const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true }, // in USD or MATIC/ETH equivalent
  image: { type: String, required: true },
  category: { type: String, default: "all" },
  condition: { type: String, default: "Good" },
  location: { type: String, default: "Remote" },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sellerWallet: { type: String, required: true },
  isSold: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
