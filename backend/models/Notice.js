const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    badge: {
        type: String,
        default: 'Notice',
        trim: true
    },
    badgeColor: {
        type: String,
        default: 'primary',
        enum: ['primary', 'success', 'warning', 'danger', 'info'],
        trim: true
    },
    buttonText: {
        type: String,
        default: 'Learn More',
        trim: true
    },
    buttonLink: {
        type: String,
        default: '#',
        trim: true
    },
    icon: {
        type: String,
        default: 'fas fa-bullhorn',
        trim: true
    },
    pdfUrl: {
        type: String,
        default: '',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Store PDFs as base64 to keep simple file storage without external services

module.exports = mongoose.model('Notice', noticeSchema);