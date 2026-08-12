const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Result = require('../models/Result');
const Payment = require('../models/Payment');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-production';

const normalizePhone = (value = '') => {
    let digits = String(value).replace(/\D/g, '');
    if (digits.startsWith('880') && digits.length === 13) digits = `0${digits.slice(3)}`;
    return digits;
};

function requireStudent(req, res, next) {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    try {
        req.studentSession = jwt.verify(token, JWT_SECRET);
        next();
    } catch (_) {
        res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
    }
}

// ID + registered phone login. A signed token keeps dashboard data private.
router.post('/login', async (req, res, next) => {
    try {
        const studentId = String(req.body.studentId || '').trim();
        const phone = normalizePhone(req.body.phone);
        if (!studentId || !phone) return res.status(400).json({ success: false, message: 'Student ID and phone number are required.' });

        const student = await Student.findOne({ studentId, status: 'Active' });
        if (!student || (normalizePhone(student.phone) !== phone && normalizePhone(student.guardianPhone) !== phone)) {
            return res.status(401).json({ success: false, message: 'Student ID or registered phone number is not correct.' });
        }

        const token = jwt.sign({ studentId: student.studentId, role: 'student' }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token, student: { name: student.name, studentId: student.studentId, batch: student.batch } });
    } catch (error) { next(error); }
});

router.get('/overview', requireStudent, async (req, res, next) => {
    try {
        const studentId = req.studentSession.studentId;
        const [student, results, payments] = await Promise.all([
            Student.findOne({ studentId }).select('-notes').lean(),
            Result.find({ studentId, status: 'published' }).sort({ createdAt: -1 }).populate('examId', 'name date examType').lean(),
            Payment.find({ studentId }).sort({ createdAt: -1 }).limit(12).lean()
        ]);
        if (!student) return res.status(404).json({ success: false, message: 'Student profile was not found.' });

        const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const latestResult = results[0] || null;
        const averagePercentage = results.length ? results.reduce((sum, result) => sum + (result.percentage || 0), 0) / results.length : 0;
        res.json({ success: true, student, results, payments, summary: { totalPaid, latestResult, averagePercentage, resultCount: results.length } });
    } catch (error) { next(error); }
});

module.exports = router;
