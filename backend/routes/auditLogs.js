const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// @route   GET /api/audit-logs
// @desc    Get audit logs with pagination and filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { module, action, user, startDate, endDate, page = 1, limit = 50 } = req.query;
        let query = {};
        
        if (module) query.module = module;
        if (action) query.action = action;
        if (user) query.user = { $regex: user, $options: 'i' };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await AuditLog.countDocuments(query);
        
        res.json({
            success: true,
            logs,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ success: false, message: 'Error fetching audit logs', error: error.message });
    }
});

// @route   POST /api/audit-logs
// @desc    Create audit log entry
// @access  Public
router.post('/', async (req, res) => {
    try {
        const log = new AuditLog(req.body);
        await log.save();
        res.status(201).json({ success: true, log });
    } catch (error) {
        console.error('Error creating audit log:', error);
        res.status(500).json({ success: false, message: 'Error creating audit log', error: error.message });
    }
});

// @route   GET /api/audit-logs/summary
// @desc    Get audit log summary (count by module)
// @access  Public
router.get('/summary', async (req, res) => {
    try {
        const summary = await AuditLog.aggregate([
            { $group: { _id: '$module', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        const recentLogs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.json({ success: true, summary, recentLogs });
    } catch (error) {
        console.error('Error fetching audit summary:', error);
        res.status(500).json({ success: false, message: 'Error fetching audit summary', error: error.message });
    }
});

module.exports = router;