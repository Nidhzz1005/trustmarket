const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true }, // from blockchain
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  buyerWallet: { type: String, required: true },
  sellerWallet: { type: String, required: true },
  amount: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
