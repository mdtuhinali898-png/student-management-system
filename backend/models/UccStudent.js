const mongoose = require('mongoose');

const uccStudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, index: true },
  roll: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  guardianName: { type: String, default: '' },
  guardianPhone: { type: String, default: '' },
  
  // Batch & Program info
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'UccBatch' },
  batchName: { type: String, required: true, index: true },
  program: { type: String, default: 'Medical' },
  branch: { type: String, default: 'Pabna' },
  
  // Financial Information
  courseFee: { type: Number, required: true, default: 0 },
  discountType: { type: String, enum: ['none', 'percentage', 'fixed'], default: 'none' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  discountReference: { type: String, default: '' },
  finalFee: { type: Number, required: true, default: 0 },
  totalPaid: { type: Number, default: 0 },
  totalDue: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Full Paid', 'Partial Paid', 'Unpaid'], default: 'Unpaid' },
  
  // Material Distribution Rules & Override
  distributionOverride: { type: Boolean, default: false },
  overrideApprovedBy: { type: String, default: '' },
  overrideReason: { type: String, default: '' },
  
  // Additional optional fields (empty by default if not provided)
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  photo: { type: String, default: '' },
  notes: { type: String, default: '' },
  
  status: { type: String, enum: ['Active', 'Inactive', 'Dropped'], default: 'Active' },
  admissionDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('UccStudent', uccStudentSchema);
