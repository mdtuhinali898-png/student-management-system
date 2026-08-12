const mongoose = require('mongoose');

const uccBatchSchema = new mongoose.Schema({
  batchCode: { type: String, required: true, unique: true, index: true },
  batchName: { type: String, required: true },
  program: { type: String, required: true }, // Medical / Engineering / Varsity Unit A/B/C
  baseFee: { type: Number, required: true, default: 0 },
  capacity: { type: Number, default: 60 },
  enrolledCount: { type: Number, default: 0 },
  nextRollNumber: { type: Number, default: 1 },
  status: { type: String, enum: ['Active', 'Completed', 'Upcoming'], default: 'Active' },
  startDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('UccBatch', uccBatchSchema);
