const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    fullMark: {
        type: Number,
        required: true,
        default: 100
    },
    mcqMark: {
        type: Number,
        default: 0,
        min: 0
    },
    cqMark: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const examSchema = new mongoose.Schema({
    // Exam info
    name: {
        type: String,
        required: true,
        trim: true
    },
    examType: {
        type: String,
        enum: ['weekly', 'monthly', 'model_test', 'midterm', 'final', 'other'],
        default: 'monthly'
    },
    questionType: {
        type: String,
        enum: ['mcq', 'cq', 'both'],
        default: 'mcq'
    },
    date: {
        type: Date,
        required: true
    },
    batch: {
        type: String,
        required: true,
        trim: true
    },
    // Subjects with full marks
    subjects: [subjectSchema],
    // Status
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    // Optional description
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
examSchema.index({ batch: 1 });
examSchema.index({ date: -1 });
examSchema.index({ status: 1 });

module.exports = mongoose.model('Exam', examSchema);
