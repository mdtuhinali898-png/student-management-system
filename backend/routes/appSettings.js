const express = require('express');
const AppSettings = require('../models/AppSettings');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const setting = await AppSettings.findOne({ key: 'main-settings' }).lean();
        res.json({ success: true, data: setting ? setting.data : null });
    } catch (error) { next(error); }
});

router.put('/', async (req, res, next) => {
    try {
        const setting = await AppSettings.findOneAndUpdate(
            { key: 'main-settings' }, { key: 'main-settings', data: req.body },
            { new: true, upsert: true, runValidators: true }
        ).lean();
        res.json({ success: true, data: setting.data });
    } catch (error) { next(error); }
});

module.exports = router;
