const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    month: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        trim: true,
        default: 'Admin'
    }
}, {
    timestamps: true
});

budgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true });
budgetSchema.index({ month: 1, year: 1 });

module.exports = mongoose.model('Budget', budgetSchema);