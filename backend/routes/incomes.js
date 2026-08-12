const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const AuditLog = require('../models/AuditLog');

// Helper: generate income ID
async function generateIncomeId() {
    const count = await Income.countDocuments();
    return 'INC-' + Date.now() + '-' + (count + 1);
}

// @route   GET /api/incomes
// @desc    Get all incomes with filtering
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            source, method, status,
            fromDate, toDate, startDate, endDate,
            search, page = 1, limit = 50,
            sortBy = 'date', sortOrder = 'desc'
        } = req.query;

        let query = {};

        if (source && source !== 'all') query.source = source;
        if (method && method !== 'all') query.paymentMethod = method;
        if (status && status !== 'all') query.status = status;

        const df = fromDate || startDate;
        const dt = toDate || endDate;
        if (df && dt) {
            query.date = { $gte: df, $lte: dt };
        } else if (df) {
            query.date = { $gte: df };
        } else if (dt) {
            query.date = { $lte: dt };
        }

        if (search) {
            query.$or = [
                { incomeId: { $regex: search, $options: 'i' } },
                { receivedFrom: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const incomes = await Income.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Income.countDocuments(query);
        const allFiltered = await Income.find(query);
        const totalFilteredAmount = allFiltered.reduce((sum, i) => sum + i.amount, 0);

        res.json({
            success: true,
            incomes,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalFilteredAmount
        });
    } catch (error) {
        console.error('Error fetching incomes:', error);
        res.status(500).json({ success: false, message: 'Error fetching incomes', error: error.message });
    }
});

// @route   GET /api/incomes/summary
// @desc    Get income summary by source
// @access  Public
router.get('/summary', async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        let query = { status: 'Active' };
        if (fromDate && toDate) query.date = { $gte: fromDate, $lte: toDate };

        const bySource = await Income.aggregate([
            { $match: query },
            { $group: { _id: '$source', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);

        const byMethod = await Income.aggregate([
            { $match: query },
            { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } }
        ]);

        const totalIncome = await Income.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            success: true,
            bySource: bySource.map(s => ({ source: s._id, total: s.total, count: s.count })),
            byMethod: byMethod.map(m => ({ method: m._id, total: m.total, count: m.count })),
            totalIncome: totalIncome[0]?.total || 0
        });
    } catch (error) {
        console.error('Error fetching income summary:', error);
        res.status(500).json({ success: false, message: 'Error fetching income summary', error: error.message });
    }
});

// @route   GET /api/incomes/:id
// @desc    Get single income
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const income = await Income.findById(req.params.id);
        if (!income) return res.status(404).json({ success: false, message: 'Income record not found' });
        res.json({ success: true, income });
    } catch (error) {
        console.error('Error fetching income:', error);
        res.status(500).json({ success: false, message: 'Error fetching income', error: error.message });
    }
});

// @route   POST /api/incomes
// @desc    Create income record
// @access  Public
router.post('/', async (req, res) => {
    try {
        const incomeData = { ...req.body };

        // Auto-generate ID
        incomeData.incomeId = await generateIncomeId();

        // Auto-fill month/year from date
        if (incomeData.date && (!incomeData.month || !incomeData.year)) {
            const d = new Date(incomeData.date + 'T00:00:00');
            if (!incomeData.month) incomeData.month = d.toLocaleString('default', { month: 'long' });
            if (!incomeData.year) incomeData.year = d.getFullYear();
        }

        const income = new Income(incomeData);
        await income.save();

        // Audit log
        await new AuditLog({
            user: incomeData.createdBy || 'Admin',
            action: 'Income Created',
            module: 'Income',
            recordId: income._id.toString(),
            newValue: { amount: income.amount, source: income.source },
            description: `Income ${income.incomeId} created - ${income.source}: ৳${income.amount}`
        }).save();

        res.status(201).json({ success: true, message: 'Income recorded successfully', income });
    } catch (error) {
        console.error('Error creating income:', error);
        res.status(500).json({ success: false, message: 'Error creating income', error: error.message });
    }
});

// @route   PUT /api/incomes/:id
// @desc    Update income record
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const old = await Income.findById(req.params.id);
        if (!old) return res.status(404).json({ success: false, message: 'Income not found' });

        const updateData = { ...req.body };
        if (updateData.date) {
            const d = new Date(updateData.date + 'T00:00:00');
            if (!updateData.month) updateData.month = d.toLocaleString('default', { month: 'long' });
            if (!updateData.year) updateData.year = d.getFullYear();
        }

        const income = await Income.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        await new AuditLog({
            user: updateData.createdBy || 'Admin',
            action: 'Income Edited',
            module: 'Income',
            recordId: income._id.toString(),
            oldValue: { amount: old.amount, source: old.source },
            newValue: { amount: income.amount, source: income.source },
            description: `Income ${income.incomeId} edited`
        }).save();

        res.json({ success: true, message: 'Income updated successfully', income });
    } catch (error) {
        console.error('Error updating income:', error);
        res.status(500).json({ success: false, message: 'Error updating income', error: error.message });
    }
});

// @route   PATCH /api/incomes/:id/void
// @desc    Void income record (soft delete)
// @access  Public
router.patch('/:id/void', async (req, res) => {
    try {
        const { voidReason, voidedBy } = req.body;
        const income = await Income.findByIdAndUpdate(
            req.params.id,
            { status: 'Voided', voidReason: voidReason || '' },
            { new: true }
        );
        if (!income) return res.status(404).json({ success: false, message: 'Income not found' });

        await new AuditLog({
            user: voidedBy || 'Admin',
            action: 'Income Voided',
            module: 'Income',
            recordId: income._id.toString(),
            newValue: { status: 'Voided', reason: voidReason },
            description: `Income ${income.incomeId} voided: ${voidReason || 'No reason'}`
        }).save();

        res.json({ success: true, message: 'Income voided successfully', income });
    } catch (error) {
        console.error('Error voiding income:', error);
        res.status(500).json({ success: false, message: 'Error voiding income', error: error.message });
    }
});

module.exports = router;
