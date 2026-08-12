const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Expense = require('../models/Expense');

// @route   GET /api/payroll
// @desc    Get all payroll records with filtering
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { month, year, status, employeeId, page = 1, limit = 50 } = req.query;
        let query = {};
        
        if (month) query.month = month;
        if (year) query.year = parseInt(year);
        if (status) query.status = status;
        if (employeeId) query.employeeId = employeeId;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const records = await Payroll.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Payroll.countDocuments(query);
        
        res.json({
            success: true,
            records,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching payroll records:', error);
        res.status(500).json({ success: false, message: 'Error fetching payroll records', error: error.message });
    }
});

// @route   GET /api/payroll/summary
// @desc    Get payroll summary
// @access  Public
router.get('/summary', async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetMonth = month || new Date().toLocaleString('default', { month: 'long' });
        const targetYear = year || new Date().getFullYear();
        
        const records = await Payroll.find({ month: targetMonth, year: parseInt(targetYear) });
        
        const totalSalary = records.reduce((sum, r) => sum + r.salary, 0);
        const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
        const totalDue = records.reduce((sum, r) => sum + r.dueSalary, 0);
        const totalAdvance = records.reduce((sum, r) => sum + r.advance, 0);
        const totalBonus = records.reduce((sum, r) => sum + r.bonus, 0);
        const totalDeduction = records.reduce((sum, r) => sum + r.deduction, 0);
        const totalNetPayable = records.reduce((sum, r) => sum + r.netPayable, 0);
        const paidCount = records.filter(r => r.status === 'Paid').length;
        const pendingCount = records.filter(r => r.status === 'Pending').length;
        
        res.json({
            success: true,
            month: targetMonth,
            year: targetYear,
            totalEmployees: records.length,
            totalSalary,
            totalPaid,
            totalDue,
            totalAdvance,
            totalBonus,
            totalDeduction,
            totalNetPayable,
            paidCount,
            pendingCount
        });
    } catch (error) {
        console.error('Error fetching payroll summary:', error);
        res.status(500).json({ success: false, message: 'Error fetching payroll summary', error: error.message });
    }
});

// @route   GET /api/payroll/employees
// @desc    Get unique employee list
// @access  Public
router.get('/employees', async (req, res) => {
    try {
        const employees = await Payroll.aggregate([
            { $group: { _id: '$employeeId', name: { $first: '$employeeName' }, designation: { $first: '$designation' }, salary: { $first: '$salary' } } },
            { $sort: { name: 1 } }
        ]);
        
        res.json({ success: true, employees: employees.map(e => ({ employeeId: e._id, name: e.name, designation: e.designation, salary: e.salary })) });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ success: false, message: 'Error fetching employees', error: error.message });
    }
});

// @route   GET /api/payroll/:id
// @desc    Get single payroll record by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const record = await Payroll.findById(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: 'Payroll record not found' });
        res.json({ success: true, record });
    } catch (error) {
        console.error('Error fetching payroll record:', error);
        res.status(500).json({ success: false, message: 'Error fetching payroll record', error: error.message });
    }
});

// @route   POST /api/payroll
// @desc    Create payroll record
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { employeeId, employeeName, designation, salary, month, year } = req.body;
        
        if (!employeeId || !employeeName || !designation || !salary || !month || !year) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Check for existing record
        const existing = await Payroll.findOne({ employeeId, month, year });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Payroll record already exists for this employee in this period' });
        }
        
        const netPayable = salary + (req.body.bonus || 0) - (req.body.deduction || 0);
        const dueSalary = netPayable - (req.body.paidAmount || 0);
        
        const record = new Payroll({
            ...req.body,
            netPayable,
            dueSalary: Math.max(0, dueSalary),
            status: dueSalary <= 0 ? 'Paid' : (req.body.paidAmount > 0 ? 'Partial' : 'Pending')
        });
        
        await record.save();
        
        // Create expense entry for salary if paid
        if (record.paidAmount > 0) {
            const salaryExpense = new Expense({
                expenseId: 'SAL-' + Date.now() + '-' + (await Expense.countDocuments() + 1),
                date: record.paymentDate || new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().substring(0, 5),
                month: record.month,
                year: record.year,
                category: 'Salary',
                subCategory: designation,
                paymentMethod: record.paymentMethod,
                vendor: employeeName,
                amount: record.paidAmount,
                description: `Salary payment for ${employeeName} (${designation}) - ${month} ${year}`,
                status: 'Approved',
                createdBy: req.body.createdBy || 'Admin'
            });
            await salaryExpense.save();
        }
        
        res.status(201).json({ success: true, message: 'Payroll record created successfully', record });
    } catch (error) {
        console.error('Error creating payroll record:', error);
        res.status(500).json({ success: false, message: 'Error creating payroll record', error: error.message });
    }
});

// @route   PUT /api/payroll/:id
// @desc    Update payroll record
// @access  Public
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };
        const existing = await Payroll.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Payroll record not found' });
        
        const salary = updateData.salary || existing.salary;
        const bonus = updateData.bonus !== undefined ? updateData.bonus : existing.bonus;
        const deduction = updateData.deduction !== undefined ? updateData.deduction : existing.deduction;
        const paidAmount = updateData.paidAmount !== undefined ? updateData.paidAmount : existing.paidAmount;
        
        updateData.netPayable = salary + bonus - deduction;
        updateData.dueSalary = Math.max(0, updateData.netPayable - paidAmount);
        updateData.status = updateData.dueSalary <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');
        
        const record = await Payroll.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({ success: true, message: 'Payroll record updated successfully', record });
    } catch (error) {
        console.error('Error updating payroll record:', error);
        res.status(500).json({ success: false, message: 'Error updating payroll record', error: error.message });
    }
});

// @route   DELETE /api/payroll/:id
// @desc    Delete payroll record
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const record = await Payroll.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ success: false, message: 'Payroll record not found' });
        res.json({ success: true, message: 'Payroll record deleted successfully' });
    } catch (error) {
        console.error('Error deleting payroll record:', error);
        res.status(500).json({ success: false, message: 'Error deleting payroll record', error: error.message });
    }
});

module.exports = router;