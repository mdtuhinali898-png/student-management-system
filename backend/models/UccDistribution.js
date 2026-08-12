const mongoose = require('mongoose');

const uccDistributionSchema = new mongoose.Schema({
  voucherNo: { type: String, required: true, unique: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'UccStudent', required: true, index: true },
  studentRoll: { type: String, required: true },
  studentName: { type: String, required: true },
  batchName: { type: String, required: true },
  
  items: [{
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'UccMaterial' },
    materialCode: String,
    materialName: String,
    quantity: { type: Number, default: 1 },
    issuedAt: { type: Date, default: Date.now }
  }],
  
  hasOverride: { type: Boolean, default: false },
  overrideReason: { type: String, default: '' },
  issuedBy: { type: String, default: 'Admin' },
  issuedDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('UccDistribution', uccDistributionSchema);
