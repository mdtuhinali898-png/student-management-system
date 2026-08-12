const mongoose = require('mongoose');

const dueSchema = new mongoose.Schema({
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
    batch: {
        type: String,
        trim: true
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
    feeAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    dueAmount: {
        type: Number,
        default: function() {
            return this.feeAmount - this.paidAmount;
        }
    },
    status: {
        type: String,
        enum: ['Unpaid', 'Partial', 'Paid', 'Overdue'],
        default: 'Unpaid'
    },
    dueDate: {
        type: String
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

dueSchema.index({ studentId: 1 });
dueSchema.index({ month: 1, year: 1 });
dueSchema.index({ status: 1 });
dueSchema.index({ batch: 1 });

module.exports = mongoose.model('Due', dueSchema);