const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
    key: { type: String, default: 'main-settings', unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);
