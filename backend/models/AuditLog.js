const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  action: { type: String, required: true },
  details: { type: String },
  txHash: { type: String },
  oldTrustScore: { type: Number },
  newTrustScore: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
