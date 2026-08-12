const mongoose = require('mongoose');

const uccSettingsSchema = new mongoose.Schema({
  branchName: { type: String, default: 'UCC Pabna Branch' },
  address: { type: String, default: 'Pabna Branch' },
  contactPhone: { type: String, default: '01700000000' },
  receiptHeaderTitle: { type: String, default: 'UCC ADMISSION & COACHING' },
  receiptFooterTerms: { type: String, default: 'Fees once paid are non-refundable.' }
}, {
  timestamps: true
});

module.exports = mongoose.model('UccSettings', uccSettingsSchema);
