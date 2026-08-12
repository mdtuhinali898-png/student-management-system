const express = require('express');
const LandingSettings = require('../models/LandingSettings');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const setting = await LandingSettings.findOne({ key: 'public-landing' }).lean();
        res.json({ success: true, data: setting ? setting.data : null });
    } catch (error) { next(error); }
});

router.put('/', async (req, res, next) => {
    try {
        const setting = await LandingSettings.findOneAndUpdate(
            { key: 'public-landing' },
            { data: req.body, key: 'public-landing' },
            { new: true, upsert: true, runValidators: true }
        ).lean();
        res.json({ success: true, data: setting.data });
    } catch (error) { next(error); }
});

module.exports = router;
