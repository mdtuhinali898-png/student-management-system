const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        trim: true
    },
    employeeName: {
        type: String,
        required: true,
        trim: true
    },
    designation: {
        type: String,
        required: true,
        trim: true
    },
    salary: {
        type: Number,
        required: true,
        min: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueSalary: {
        type: Number,
        default: 0
    },
    advance: {
        type: Number,
        default: 0
    },
    bonus: {
        type: Number,
        default: 0
    },
    deduction: {
        type: Number,
        default: 0
    },
    netPayable: {
        type: Number,
        default: 0
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
    paymentDate: {
        type: String
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Card', 'Cheque'],
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Partial'],
        default: 'Pending'
    },
    notes: {
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

payrollSchema.index({ employeeId: 1 });
payrollSchema.index({ month: 1, year: 1 });
payrollSchema.index({ status: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);