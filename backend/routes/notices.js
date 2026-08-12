const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');

// Get all active notices for public landing page
router.get('/public', async (req, res, next) => {
    try {
        const notices = await Notice.find({ isActive: true })
            .sort({ sortOrder: 1, createdAt: -1 })
            .limit(10)
            .lean();
        res.json({ success: true, data: notices });
    } catch (error) { next(error); }
});

// Admin: Get all notices
router.get('/', async (req, res, next) => {
    try {
        const notices = await Notice.find({})
            .sort({ sortOrder: 1, createdAt: -1 })
            .lean();
        res.json({ success: true, data: notices });
    } catch (error) { next(error); }
});

// Admin: Create notice
router.post('/', async (req, res, next) => {
    try {
        const notice = await Notice.create(req.body);
        res.json({ success: true, data: notice });
    } catch (error) { next(error); }
});

// Admin: Update notice
router.put('/:id', async (req, res, next) => {
    try {
        const notice = await Notice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.json({ success: true, data: notice });
    } catch (error) { next(error); }
});

// Upload PDF for notice
router.post('/:id/upload-pdf', async (req, res, next) => {
    try {
        const { pdfData, fileName } = req.body;
        
        if (!pdfData) {
            return res.status(400).json({ success: false, message: 'PDF data is required' });
        }
        
        const notice = await Notice.findById(req.params.id);
        if (!notice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }
        
        // Store PDF as base64 data URL
        const pdfUrl = `data:application/pdf;base64,${pdfData}`;
        notice.pdfUrl = pdfUrl;
        await notice.save();
        
        res.json({ success: true, data: notice });
    } catch (error) { next(error); }
});

// Admin: Delete notice
router.delete('/:id', async (req, res, next) => {
    try {
        await Notice.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { next(error); }
});

module.exports = router;