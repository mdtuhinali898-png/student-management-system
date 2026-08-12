const express = require('express');
const router = express.Router();
const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');

// @route   GET /api/recurring-expenses
// @desc    Get all recurring expenses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;
        
        const expenses = await RecurringExpense.find(query).sort({ nextDueDate: 1 });
        res.json({ success: true, expenses });
    } catch (error) {
        console.error('Error fetching recurring expenses:', error);
        res.status(500).json({ success: false, message: 'Error fetching recurring expenses', error: error.message });
    }
});

// @route   GET /api/recurring-expenses/due
// @desc    Get recurring expenses due for generation
// @access  Public
router.get('/due', async (req, res) => {
    try {
        const now = new Date();
        const expenses = await RecurringExpense.find({
            status: 'Active',
            nextDueDate: { $lte: now }
        }).sort({ nextDueDate: 1 });
        
        res.json({ success: true, expenses, count: expenses.length });
    } catch (error) {
        console.error('Error fetching due recurring expenses:', error);
        res.status(500).json({ success: false, message: 'Error fetching due recurring expenses', error: error.message });
    }
});

// @route   POST /api/recurring-expenses
// @desc    Create recurring expense
// @access  Public
router.post('/', async (req, res) => {
    try {
        const expense = new RecurringExpense(req.body);
        await expense.save();
        res.status(201).json({ success: true, message: 'Recurring expense created successfully', expense });
    } catch (error) {
        console.error('Error creating recurring expense:', error);
        res.status(500).json({ success: false, message: 'Error creating recurring expense', error: error.message });
    }
});

// @route   POST /api/recurring-expenses/:id/generate
// @desc    Generate an expense from a recurring template
// @access  Public
router.post('/:id/generate', async (req, res) => {
    try {
        const template = await RecurringExpense.findById(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Recurring expense not found' });
        if (template.status !== 'Active') return res.status(400).json({ success: false, message: 'Recurring expense is not active' });
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        
        const expenseCount = await Expense.countDocuments();
        const expense = new Expense({
            expenseId: 'REC-' + Date.now() + '-' + (expenseCount + 1),
            date: dateStr,
            time: now.toTimeString().substring(0, 5),
            month: monthName,
            year: year,
            category: template.category,
            subCategory: template.subCategory,
            paymentMethod: template.paymentMethod,
            vendor: template.vendor,
            amount: template.amount,
            description: template.description || `Recurring: ${template.title}`,
            status: 'Pending Approval',
            createdBy: 'System',
            recurringExpenseId: template._id
        });
        
        await expense.save();
        
        // Update next due date
        const nextDueDate = new Date(template.nextDueDate);
        switch(template.frequency) {
            case 'Weekly':
                nextDueDate.setDate(nextDueDate.getDate() + 7);
                break;
            case 'Monthly':
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                break;
            case 'Yearly':
                nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                break;
        }
        
        template.lastGeneratedDate = now;
        template.nextDueDate = nextDueDate;
        await template.save();
        
        res.json({ success: true, message: 'Expense generated from recurring template', expense });
    } catch (error) {
        console.error('Error generating recurring expense:', error);
        res.status(500).json({ success: false, message: 'Error generating recurring expense', error: error.message });
    }
});

// @route   PUT /api/recurring-expenses/:id
// @desc    Update recurring expense
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const expense = await RecurringExpense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!expense) return res.status(404).json({ success: false, message: 'Recurring expense not found' });
        res.json({ success: true, message: 'Recurring expense updated successfully', expense });
    } catch (error) {
        console.error('Error updating recurring expense:', error);
        res.status(500).json({ success: false, message: 'Error updating recurring expense', error: error.message });
    }
});

// @route   DELETE /api/recurring-expenses/:id
// @desc    Delete recurring expense
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const expense = await RecurringExpense.findByIdAndDelete(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: 'Recurring expense not found' });
        res.json({ success: true, message: 'Recurring expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting recurring expense:', error);
        res.status(500).json({ success: false, message: 'Error deleting recurring expense', error: error.message });
    }
});

module.exports = router;