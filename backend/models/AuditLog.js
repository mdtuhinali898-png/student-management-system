const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        trim: true,
        default: 'Admin'
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    module: {
        type: String,
        required: true,
        trim: true
    },
    recordId: {
        type: String,
        trim: true
    },
    oldValue: {
        type: mongoose.Schema.Types.Mixed
    },
    newValue: {
        type: mongoose.Schema.Types.Mixed
    },
    description: {
        type: String,
        trim: true
    },
    ip: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);