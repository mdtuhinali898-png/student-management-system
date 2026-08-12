const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 2020,
        max: 2030
    },
    fee: {
        type: Number,
        required: true,
        default: 1500,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    prefix: {
        type: String,
        trim: true,
        default: '',
        maxlength: 10
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    createdDate: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    }
}, {
    timestamps: true
});

// Index for better query performance
batchSchema.index({ name: 1 });
batchSchema.index({ year: 1 });
batchSchema.index({ status: 1 });

module.exports = mongoose.model('Batch', batchSchema);