const mongoose = require('mongoose');

const financeBudgetSchema = new mongoose.Schema({
    category: { type: String, required: true, trim: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, default: '' }
}, { timestamps: true });

financeBudgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('FinanceBudget', financeBudgetSchema);
