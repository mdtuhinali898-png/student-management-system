const express = require('express');
const router = express.Router();
const AppSettings = require('../models/AppSettings');

// Get public institute info (accessible without auth)
router.get('/public', async (req, res, next) => {
    try {
        const setting = await AppSettings.findOne({ key: 'main-settings' }).lean();
        const data = setting ? setting.data : {};
        
        // Return only public-safe institute info
        const publicInfo = {
            name: data.institute?.name || data.name || 'EduSmart Coaching Center',
            logo: data.institute?.logo || data.logo || '',
            phone: data.institute?.phone || data.phone || '',
            email: data.institute?.email || data.email || '',
            address: data.institute?.address || data.address || '',
            website: data.institute?.website || data.website || '',
            established: data.institute?.established || data.established || '',
            about: data.institute?.about || data.about || '',
            director: data.institute?.director || data.director || ''
        };
        
        res.json({ success: true, data: publicInfo });
    } catch (error) { next(error); }
});

// Get full institute info (admin only)
router.get('/', async (req, res, next) => {
    try {
        const setting = await AppSettings.findOne({ key: 'main-settings' }).lean();
        res.json({ success: true, data: setting ? setting.data : null });
    } catch (error) { next(error); }
});

// Update institute info
router.put('/', async (req, res, next) => {
    try {
        const setting = await AppSettings.findOneAndUpdate(
            { key: 'main-settings' },
            { key: 'main-settings', data: req.body },
            { new: true, upsert: true, runValidators: true }
        ).lean();
        res.json({ success: true, data: setting.data });
    } catch (error) { next(error); }
});

module.exports = router;