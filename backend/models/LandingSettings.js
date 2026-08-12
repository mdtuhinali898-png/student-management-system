const mongoose = require('mongoose');

const landingSettingsSchema = new mongoose.Schema({
    key: { type: String, default: 'public-landing', unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LandingSettings', landingSettingsSchema);
