const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Receipt number (auto-generated)
    receiptNo: {
        type: String,
        unique: true,
        trim: true
    },
    
    // Student Information
    studentId: {
        type: String,
        required: true,
        trim: true,
        ref: 'Student'
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    
    // Payment Details
    month: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    
    // Amount Details
    fee: {
        type: Number,
        required: true,
        default: 0
    },
    monthlyFee: {
        type: Number,
        default: 0
    },
    admissionFee: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    fine: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    
    // Payment Method
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash', 'Bank Transfer', 'bKash', 'Nagad', 'Rocket', 'Card'],
        trim: true
    },
    
    // Payment Type (Monthly fee or Admission fee)
    type: {
        type: String,
        enum: ['Monthly', 'Admission'],
        default: 'Monthly',
        trim: true
    },

    // Status
    status: {
        type: String,
        enum: ['Paid', 'Partial', 'Due'],
        default: 'Paid'
    },
    
    // Additional Information
    remarks: {
        type: String,
        trim: true
    },
    date: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ studentId: 1 });
paymentSchema.index({ date: 1 });
paymentSchema.index({ month: 1, year: 1 });
paymentSchema.index({ receiptNo: 1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ year: 1 });                         // due-summary: Payment.find({ year })
paymentSchema.index({ date: 1, amount: 1 });              // range aggregation: $match date + $sum amount
paymentSchema.index({ year: 1, paymentMethod: 1 });       // balance by method (all-time scans)
paymentSchema.index({ type: 1, year: 1 });                // incomeBySource by type+year

// Method to calculate total
paymentSchema.methods.calculateTotal = function() {
    return this.fee - this.discount + this.fine;
};

// Static method to get payment statistics
paymentSchema.statics.getStatistics = async function(studentId) {
    const payments = await this.find({ studentId });
    
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDiscount = payments.reduce((sum, p) => sum + p.discount, 0);
    const totalFine = payments.reduce((sum, p) => sum + p.fine, 0);
    
    return {
        totalPayments: payments.length,
        totalPaid,
        totalDiscount,
        totalFine,
        averagePayment: payments.length > 0 ? totalPaid / payments.length : 0
    };
};

module.exports = mongoose.model('Payment', paymentSchema);
