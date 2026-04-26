const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerName: { type: String },
  reviewerInitials: { type: String },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
