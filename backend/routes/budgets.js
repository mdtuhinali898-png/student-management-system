const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @route   GET /api/budgets
// @desc    Get all budgets with optional month/year filter
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { month, year } = req.query;
        let query = {};
        
        if (month) query.month = month;
        if (year) query.year = parseInt(year) || new Date().getFullYear();
        else query.year = new Date().getFullYear();
        
        const budgets = await Budget.find(query).sort({ category: 1 });
        
        // Get current month's expenses by category for comparison
        const targetMonth = month || new Date().toLocaleString('default', { month: 'long' });
        const targetYear = query.year;
        
        const expenses = await Expense.find({ 
            month: targetMonth, 
            year: targetYear,
            status: 'Approved'
        });
        
        const expenseByCategory = {};
        expenses.forEach(e => {
            if (!expenseByCategory[e.category]) expenseByCategory[e.category] = 0;
            expenseByCategory[e.category] += e.amount;
        });
        
        const budgetWithUsage = budgets.map(b => {
            const currentExpense = expenseByCategory[b.category] || 0;
            const remaining = b.amount - currentExpense;
            const usedPercentage = b.amount > 0 ? (currentExpense / b.amount) * 100 : 0;
            
            let alert = 'normal';
            if (usedPercentage >= 100) alert = 'exceeded';
            else if (usedPercentage >= 90) alert = 'high';
            else if (usedPercentage >= 70) alert = 'warning';
            
            return {
                ...b.toObject(),
                currentExpense,
                remaining: Math.max(0, remaining),
                usedPercentage: Math.round(usedPercentage * 100) / 100,
                alert
            };
        });
        
        res.json({ success: true, budgets: budgetWithUsage });
    } catch (error) {
        console.error('Error fetching budgets:', error);
        res.status(500).json({ success: false, message: 'Error fetching budgets', error: error.message });
    }
});

// @route   GET /api/budgets/summary
// @desc    Get budget summary with alerts
// @access  Public
router.get('/summary', async (req, res) => {
    try {
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();
        
        const budgets = await Budget.find({ month: currentMonth, year: currentYear });
        const expenses = await Expense.find({ month: currentMonth, year: currentYear, status: 'Approved' });
        
        const expenseByCategory = {};
        expenses.forEach(e => {
            if (!expenseByCategory[e.category]) expenseByCategory[e.category] = 0;
            expenseByCategory[e.category] += e.amount;
        });
        
        let totalBudget = 0;
        let totalExpense = 0;
        const alerts = [];
        
        budgets.forEach(b => {
            totalBudget += b.amount;
            const currentExpense = expenseByCategory[b.category] || 0;
            totalExpense += currentExpense;
            const pct = b.amount > 0 ? (currentExpense / b.amount) * 100 : 0;
            
            if (pct >= 100) {
                alerts.push({ category: b.category, level: 'danger', message: `${b.category} budget exceeded! (${Math.round(pct)}%)` });
            } else if (pct >= 90) {
                alerts.push({ category: b.category, level: 'warning', message: `${b.category} budget nearly full (${Math.round(pct)}%)` });
            } else if (pct >= 70) {
                alerts.push({ category: b.category, level: 'info', message: `${b.category} at ${Math.round(pct)}% usage` });
            }
        });
        
        res.json({
            success: true,
            totalBudget,
            totalExpense,
            remaining: Math.max(0, totalBudget - totalExpense),
            usagePercentage: totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0,
            budgetCount: budgets.length,
            alerts
        });
    } catch (error) {
        console.error('Error fetching budget summary:', error);
        res.status(500).json({ success: false, message: 'Error fetching budget summary', error: error.message });
    }
});

// @route   POST /api/budgets
// @desc    Create or update budget
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { category, amount, month, year, notes } = req.body;
        
        if (!category || amount === undefined || !month || !year) {
            return res.status(400).json({ success: false, message: 'Category, amount, month and year are required' });
        }
        
        // Upsert: update if exists, create if not
        const budget = await Budget.findOneAndUpdate(
            { category, month, year },
            { amount, notes, isActive: true },
            { upsert: true, new: true, runValidators: true }
        );
        
        res.json({ success: true, message: 'Budget saved successfully', budget });
    } catch (error) {
        console.error('Error saving budget:', error);
        res.status(500).json({ success: false, message: 'Error saving budget', error: error.message });
    }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
        res.json({ success: true, message: 'Budget updated successfully', budget });
    } catch (error) {
        console.error('Error updating budget:', error);
        res.status(500).json({ success: false, message: 'Error updating budget', error: error.message });
    }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const budget = await Budget.findByIdAndDelete(req.params.id);
        if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
        res.json({ success: true, message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Error deleting budget:', error);
        res.status(500).json({ success: false, message: 'Error deleting budget', error: error.message });
    }
});

module.exports = router;