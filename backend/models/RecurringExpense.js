const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    subCategory: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Card', 'Cheque'],
        default: 'Cash'
    },
    vendor: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    frequency: {
        type: String,
        enum: ['Weekly', 'Monthly', 'Yearly'],
        required: true,
        default: 'Monthly'
    },
    nextDueDate: {
        type: Date,
        required: true
    },
    lastGeneratedDate: {
        type: Date
    },
    autoGenerate: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Active', 'Paused', 'Cancelled'],
        default: 'Active'
    },
    createdBy: {
        type: String,
        trim: true,
        default: 'Admin'
    }
}, {
    timestamps: true
});

recurringExpenseSchema.index({ status: 1 });
recurringExpenseSchema.index({ nextDueDate: 1 });
recurringExpenseSchema.index({ category: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);