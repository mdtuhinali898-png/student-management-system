const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Payment = require('../models/Payment');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (optimized)
// @access  Public
router.get('/stats', async (req, res) => {
    try {
        // Run independent queries in parallel
        const [
            totalStudents,
            activeStudents,
            newAdmissions,
            todayPayments,
            monthPayments,
            activeStudentList
        ] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ status: 'Active' }),
            Student.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }),
            Payment.find({ date: new Date().toISOString().split('T')[0] }).lean(),
            Payment.find({ 
                month: new Date().toLocaleString('default', { month: 'long' }),
                year: new Date().getFullYear()
            }).lean(),
            Student.find({ status: 'Active' }).select('studentId fee').lean()
        ]);
        
        const todayCollection = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const monthlyIncome = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        // Optimized due calculation: get all payments in one query and use Map for lookups
        const allPayments = await Payment.find().select('studentId month year amount').lean();
        
        // Index payments by studentId for O(1) lookup
        const paymentMap = {};
        allPayments.forEach(p => {
            if (!paymentMap[p.studentId]) paymentMap[p.studentId] = [];
            paymentMap[p.studentId].push(p);
        });
        
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth();
        
        let dueCount = 0;
        for (const student of activeStudentList) {
            const studentPayments = paymentMap[student.studentId] || [];
            let unpaidCount = 0;
            
            for (let i = 0; i < 12 && unpaidCount === 0; i++) { // break early if unpaid found
                const monthIndex = (currentMonthIndex - i + 12) % 12;
                const monthName = months[monthIndex];
                const monthYear = monthIndex > currentMonthIndex ? currentYear - 1 : currentYear;
                
                const monthPaid = studentPayments
                    .filter(p => p.month === monthName && p.year === monthYear)
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                
                if (monthPaid < (student.fee || 0)) unpaidCount++;
            }
            
            if (unpaidCount > 0) dueCount++;
        }
        
        const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
        
        res.json({
            success: true,
            totalStudents,
            newAdmissions,
            todayCollection,
            todayPaymentsCount: todayPayments.length,
            monthlyIncome,
            currentMonth: currentMonthName,
            dueStudentsCount: dueCount
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics', error: error.message });
    }
});

// @route   GET /api/dashboard/recent-payments
// @desc    Get recent payments (optimized)
// @access  Public
router.get('/recent-payments', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const recentPayments = await Payment.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        
        // Batch fetch students for all payments at once
        const studentIds = [...new Set(recentPayments.map(p => p.studentId))];
        const students = await Student.find({ studentId: { $in: studentIds } })
            .select('studentId batch')
            .lean();
        const studentMap = {};
        students.forEach(s => { studentMap[s.studentId] = s; });
        
        const transformed = recentPayments.map(p => ({
            id: p.studentId,
            name: p.studentName || 'Unknown',
            batch: studentMap[p.studentId]?.batch || 'N/A',
            month: p.month,
            amount: p.amount,
            status: p.status
        }));
        
        res.json(transformed);
    } catch (error) {
        console.error('Error fetching recent payments:', error);
        res.json([]);
    }
});

// @route   GET /api/dashboard/recent-admissions
// @desc    Get recent admissions
// @access  Public
router.get('/recent-admissions', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const recentAdmissions = await Student.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        
        res.json(recentAdmissions.map(s => ({
            id: s.studentId,
            name: s.name,
            batch: s.batch,
            date: s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB') : 'N/A'
        })));
    } catch (error) {
        console.error('Error fetching recent admissions:', error);
        res.status(500).json({ success: false, message: 'Error fetching recent admissions' });
    }
});

// @route   GET /api/dashboard/due-students
// @desc    Get due students (optimized)
// @access  Public
router.get('/due-students', async (req, res) => {
    try {
        const [allStudents, allPayments] = await Promise.all([
            Student.find({ status: 'Active' }).select('studentId name fee').lean(),
            Payment.find().select('studentId month year amount').lean()
        ]);
        
        // Index payments
        const paymentMap = {};
        allPayments.forEach(p => {
            if (!paymentMap[p.studentId]) paymentMap[p.studentId] = [];
            paymentMap[p.studentId].push(p);
        });
        
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth();
        
        const dueStudents = [];
        
        for (const student of allStudents) {
            const studentPayments = paymentMap[student.studentId] || [];
            let unpaidCount = 0;
            let totalExpected = 0;
            let totalPaidAmount = 0;
            
            for (let i = 0; i < 12; i++) {
                const monthIndex = (currentMonthIndex - i + 12) % 12;
                const monthName = months[monthIndex];
                const monthYear = monthIndex > currentMonthIndex ? currentYear - 1 : currentYear;
                
                const monthPaid = studentPayments
                    .filter(p => p.month === monthName && p.year === monthYear)
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                
                totalExpected += student.fee || 0;
                totalPaidAmount += monthPaid;
                
                if (monthPaid < (student.fee || 0)) unpaidCount++;
            }
            
            if (unpaidCount > 0) {
                dueStudents.push({
                    id: student.studentId,
                    name: student.name,
                    due: `${unpaidCount} Month(s)`,
                    totalDue: Math.max(0, totalExpected - totalPaidAmount)
                });
            }
        }
        
        dueStudents.sort((a, b) => b.totalDue - a.totalDue);
        res.json(dueStudents.slice(0, 10));
    } catch (error) {
        console.error('Error fetching due students:', error);
        res.status(500).json({ success: false, message: 'Error fetching due students' });
    }
});

// @route   GET /api/dashboard/monthly-collection
// @desc    Get monthly collection data for charts
// @access  Public
router.get('/monthly-collection', async (req, res) => {
    try {
        const monthNameMap = {
            'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
            'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
            'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
        };
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0 };
        
        const payments = await Payment.find({ year: new Date().getFullYear() }).select('month amount').lean();
        
        payments.forEach(p => {
            const short = monthNameMap[p.month];
            if (short && monthlyData[short] !== undefined) {
                monthlyData[short] += p.amount;
            }
        });
        
        res.json({ labels: months, data: Object.values(monthlyData) });
    } catch (error) {
        console.error('Error fetching monthly collection:', error);
        res.status(500).json({ success: false, message: 'Error fetching monthly collection' });
    }
});

// @route   GET /api/dashboard/batch-wise
// @desc    Get batch-wise data for charts
// @access  Public
router.get('/batch-wise', async (req, res) => {
    try {
        const batches = await Student.distinct('batch');
        
        const batchData = await Promise.all(batches.map(async (batch) => {
            const count = await Student.countDocuments({ batch });
            return { batch, totalStudents: count };
        }));
        
        res.json({
            labels: batchData.map(b => b.batch),
            data: batchData.map(b => b.totalStudents)
        });
    } catch (error) {
        console.error('Error fetching batch-wise data:', error);
        res.status(500).json({ success: false, message: 'Error fetching batch-wise data' });
    }
});

module.exports = router;