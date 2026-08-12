const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    mark: {
        type: Number,
        required: true,
        default: 0
    },
    fullMark: {
        type: Number,
        required: true,
        default: 100
    }
}, { _id: false });

const resultSchema = new mongoose.Schema({
    // Exam info
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    // Student info
    studentId: {
        type: String,
        required: true,
        trim: true
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    roll: {
        type: String,
        trim: true
    },
    batch: {
        type: String,
        required: true,
        trim: true
    },
    // Subject marks
    subjects: [markSchema],
    // Auto-calculated fields
    totalMarks: {
        type: Number,
        default: 0
    },
    totalFullMarks: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0
    },
    grade: {
        type: String,
        default: ''
    },
    gradePoint: {
        type: Number,
        default: 0
    },
    position: {
        type: Number,
        default: 0
    },
    // Teacher remarks
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    // Status
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    }
}, {
    timestamps: true
});

// Indexes
resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });
resultSchema.index({ examId: 1, position: 1 });
resultSchema.index({ studentId: 1 });
resultSchema.index({ batch: 1 });
resultSchema.index({ status: 1 });

module.exports = mongoose.model('Result', resultSchema);