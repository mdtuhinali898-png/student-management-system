const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    incomeId: {
        type: String,
        unique: true,
        trim: true
    },
    date: {
        type: String,
        required: true
    },
    month: {
        type: String,
        trim: true
    },
    year: {
        type: Number
    },
    source: {
        type: String,
        required: true,
        enum: [
            'Monthly Student Fee',
            'Admission Fee',
            'Exam Fee',
            'Books',
            'Special Course',
            'Registration Fee',
            'Other Income'
        ],
        default: 'Other Income'
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
    description: {
        type: String,
        trim: true
    },
    receivedFrom: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Voided'],
        default: 'Active'
    },
    voidReason: {
        type: String,
        trim: true
    },
    createdBy: {
        type: String,
        trim: true,
        default: 'Admin'
    }
}, {
    timestamps: true
});

// Auto-fill month/year from date
incomeSchema.pre('save', function(next) {
    if (this.date && (!this.month || !this.year)) {
        const d = new Date(this.date + 'T00:00:00');
        if (!this.month) this.month = d.toLocaleString('default', { month: 'long' });
        if (!this.year) this.year = d.getFullYear();
    }
    next();
});

incomeSchema.index({ date: 1 });
incomeSchema.index({ source: 1 });
incomeSchema.index({ month: 1, year: 1 });
incomeSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Income', incomeSchema);
