const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Student = require('../models/Student');

function validateSubjectMarks(subjects, questionType) {
    if (!['mcq', 'cq', 'both'].includes(questionType)) {
        return 'Please select MCQ, CQ, or both as the question format';
    }

    for (const subject of subjects) {
        const fullMark = Number(subject.fullMark);
        const mcqMark = Number(subject.mcqMark || 0);
        const cqMark = Number(subject.cqMark || 0);

        if (!subject.name || !Number.isFinite(fullMark) || fullMark < 1 || mcqMark < 0 || cqMark < 0) {
            return 'Each subject needs a valid name and mark';
        }
        if (questionType === 'mcq' && (mcqMark !== fullMark || cqMark !== 0)) {
            return `${subject.name}: MCQ mark must equal the full mark`;
        }
        if (questionType === 'cq' && (cqMark !== fullMark || mcqMark !== 0)) {
            return `${subject.name}: CQ mark must equal the full mark`;
        }
        if (questionType === 'both' && (mcqMark < 1 || cqMark < 1 || mcqMark + cqMark !== fullMark)) {
            return `${subject.name}: MCQ and CQ marks must add up to the full mark`;
        }
    }
    return null;
}

// GET /api/exams - Get all exams with filters
router.get('/', async (req, res) => {
    try {
        const { batch, status, examType, page = 1, limit = 50 } = req.query;
        const query = {};
        
        if (batch && batch !== 'all') query.batch = batch;
        if (status && status !== 'all') query.status = status;
        if (examType && examType !== 'all') query.examType = examType;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [exams, total] = await Promise.all([
            Exam.find(query)
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Exam.countDocuments(query)
        ]);
        
        res.json({
            success: true,
            data: exams,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
    }
});

// GET /api/exams/:id - Get single exam
router.get('/:id', async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        res.json({ success: true, data: exam });
    } catch (error) {
        console.error('Error fetching exam:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exam', error: error.message });
    }
});

// POST /api/exams - Create new exam
router.post('/', async (req, res) => {
    try {
        const { name, examType, questionType = 'mcq', date, batch, subjects, description } = req.body;
        
        if (!name || !date || !batch || !subjects || subjects.length === 0) {
            return res.status(400).json({ success: false, message: 'Name, date, batch, and subjects are required' });
        }
        const subjectError = validateSubjectMarks(subjects, questionType);
        if (subjectError) return res.status(400).json({ success: false, message: subjectError });
        
        const exam = new Exam({
            name,
            examType: examType || 'monthly',
            questionType,
            date: new Date(date),
            batch,
            subjects,
            description
        });
        
        await exam.save();
        res.status(201).json({ success: true, data: exam, message: 'Exam created successfully' });
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
    }
});

// PUT /api/exams/:id - Update exam
router.put('/:id', async (req, res) => {
    try {
        const { name, examType, questionType, date, batch, subjects, description, status } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (examType) updateData.examType = examType;
        if (date) updateData.date = new Date(date);
        if (batch) updateData.batch = batch;
        if (subjects) {
            const currentExam = questionType ? null : await Exam.findById(req.params.id).select('questionType');
            if (!questionType && !currentExam) {
                return res.status(404).json({ success: false, message: 'Exam not found' });
            }
            const effectiveQuestionType = questionType || currentExam.questionType || 'mcq';
            const subjectError = validateSubjectMarks(subjects, effectiveQuestionType);
            if (subjectError) return res.status(400).json({ success: false, message: subjectError });
            updateData.subjects = subjects;
        }
        if (questionType) {
            if (!['mcq', 'cq', 'both'].includes(questionType)) {
                return res.status(400).json({ success: false, message: 'Invalid question format' });
            }
            updateData.questionType = questionType;
        }
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;
        
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        
        res.json({ success: true, data: exam, message: 'Exam updated successfully' });
    } catch (error) {
        console.error('Error updating exam:', error);
        res.status(500).json({ success: false, message: 'Failed to update exam', error: error.message });
    }
});

// DELETE /api/exams/:id - Delete exam and its results
router.delete('/:id', async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        
        // Also delete all results for this exam
        const Result = require('../models/Result');
        await Result.deleteMany({ examId: req.params.id });
        
        res.json({ success: true, message: 'Exam and associated results deleted successfully' });
    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ success: false, message: 'Failed to delete exam', error: error.message });
    }
});

// GET /api/exams/stats - Get exam statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const total = await Exam.countDocuments();
        const published = await Exam.countDocuments({ status: 'published' });
        const draft = await Exam.countDocuments({ status: 'draft' });
        
        res.json({
            success: true,
            data: { total, published, draft }
        });
    } catch (error) {
        console.error('Error fetching exam stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
    }
});

module.exports = router;
