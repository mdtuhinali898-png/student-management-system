const mongoose = require('mongoose');

const uccMaterialSchema = new mongoose.Schema({
  materialCode: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  program: { type: String, default: 'All' },
  applicableBatches: [{ type: String }],
  stockQuantity: { type: Number, default: 100 },
  distributedCount: { type: Number, default: 0 },
  status: { type: String, enum: ['Available', 'Out of Stock'], default: 'Available' }
}, {
  timestamps: true
});

module.exports = mongoose.model('UccMaterial', uccMaterialSchema);
