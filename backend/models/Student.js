const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    // Student ID (auto-generated or custom)
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    
    // Roll number
    roll: {
        type: String,
        trim: true
    },
    
    // Personal Information
    name: {
        type: String,
        required: true,
        trim: true
    },
    guardianName: {
        type: String,
        trim: true
    },
    motherName: {
        type: String,
        trim: true
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    
    // Academic Information
    batch: {
        type: String,
        required: true,
        trim: true
    },
    group: {
        type: String,
        trim: true
    },
    previousSchool: {
        type: String,
        trim: true
    },
    
    // Guardian Information
    guardianPhone: {
        type: String,
        trim: true
    },
    
    // Financial Information
    fee: {
        type: Number,
        required: true,
        default: 0
    },
    admissionFee: {
        type: Number,
        default: 0
    },
    startMonth: {
        type: String,
        default: 'July'
    },
    
    // Status
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    
    // Additional Information
    notes: {
        type: String,
        trim: true
    },
    reference: {
        type: String,
        trim: true,
        default: ''
    },
    photo: {
        type: String,
        default: ''
    },
    
    // Timestamps
    date: {
        type: Date,
        default: Date.now
    },
    admissionDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for better query performance
studentSchema.index({ studentId: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ phone: 1 });

// Virtual for formatted admission date
studentSchema.virtual('formattedAdmissionDate').get(function() {
    return this.admissionDate.toLocaleDateString('en-GB');
});

// Method to get student summary
studentSchema.methods.getSummary = function() {
    return {
        id: this.studentId,
        name: this.name,
        batch: this.batch,
        fee: this.fee,
        status: this.status,
        photo: this.photo
    };
};

module.exports = mongoose.model('Student', studentSchema);