const mongoose = require('mongoose');

const financialAccountSchema = new mongoose.Schema({
    accountType: {
        type: String,
        enum: ['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Card', 'Cheque', 'Other'],
        required: true,
        trim: true
    },
    accountName: {
        type: String,
        default: function() {
            return this.accountType;
        },
        trim: true
    },
    balance: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

financialAccountSchema.index({ accountType: 1 }, { unique: true });

module.exports = mongoose.model('FinancialAccount', financialAccountSchema);