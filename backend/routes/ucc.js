const express = require('express');
const router = express.Router();
const UccStudent = require('../models/UccStudent');
const UccPayment = require('../models/UccPayment');
const UccBatch = require('../models/UccBatch');
const UccMaterial = require('../models/UccMaterial');
const UccDistribution = require('../models/UccDistribution');
const UccExam = require('../models/UccExam');
const UccResult = require('../models/UccResult');
const UccSettings = require('../models/UccSettings');

// Helper to generate unique receipt numbers
async function generateReceiptNo() {
  const count = await UccPayment.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `UCC-REC-${new Date().getFullYear()}-${nextNum}`;
}

// Helper to generate unique voucher numbers
async function generateVoucherNo() {
  const count = await UccDistribution.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `UCC-VOU-${new Date().getFullYear()}-${nextNum}`;
}

// =================================================================
// 🎓 1. ADMISSION & STUDENT CREATION
// =================================================================

// Get Next Available Roll for Batch
router.get('/admission/next-roll/:batchCode', async (req, res) => {
  try {
    const { batchCode } = req.params;
    let batch = await UccBatch.findOne({ batchCode });
    
    if (!batch) {
      // Default initial roll if batch not seeded yet
      return res.json({ success: true, nextRoll: 1, batchCode });
    }
    res.json({ success: true, nextRoll: batch.nextRollNumber, batchName: batch.batchName });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admission API (New Student Registration + First Payment)
router.post('/admission', async (req, res) => {
  try {
    const {
      name, phone, guardianPhone, guardianName, batchName, program,
      courseFee, discountType, discountValue, discountReference,
      initialPayment, paymentMethod, transactionId, collector
    } = req.body;

    if (!name || !phone || !batchName) {
      return res.status(400).json({ success: false, message: 'Name, Phone, and Batch are required' });
    }

    // Find or get batch details
    let batch = await UccBatch.findOne({ batchName });
    let rollNum = 1;
    if (batch) {
      rollNum = batch.nextRollNumber;
    }

    // Calculate Discount & Fees
    const fee = Number(courseFee) || (batch ? batch.baseFee : 15000);
    let discountAmt = 0;
    const discVal = Number(discountValue) || 0;

    if (discountType === 'percentage') {
      discountAmt = Math.round((fee * discVal) / 100);
    } else if (discountType === 'fixed') {
      discountAmt = discVal;
    }

    const finalFee = Math.max(0, fee - discountAmt);
    const initialPaid = Number(initialPayment) || 0;
    const totalDue = Math.max(0, finalFee - initialPaid);

    let paymentStatus = 'Unpaid';
    if (totalDue === 0 && finalFee > 0) {
      paymentStatus = 'Full Paid';
    } else if (initialPaid > 0) {
      paymentStatus = 'Partial Paid';
    }

    const formattedRoll = String(rollNum).padStart(3, '0');
    const studentId = `UCC-${(batchName || 'GEN').substring(0, 4).toUpperCase()}-${formattedRoll}`;

    // Create Student
    const student = new UccStudent({
      studentId,
      roll: formattedRoll,
      name,
      phone,
      guardianName: guardianName || '',
      guardianPhone: guardianPhone || '',
      batchId: batch ? batch._id : null,
      batchName,
      program: program || (batch ? batch.program : 'Medical'),
      courseFee: fee,
      discountType: discountType || 'none',
      discountValue: discVal,
      discountAmount: discountAmt,
      discountReference: discountReference || '',
      finalFee,
      totalPaid: initialPaid,
      totalDue,
      paymentStatus
    });

    await student.save();

    // Increment batch rolls & count if batch exists
    if (batch) {
      batch.nextRollNumber += 1;
      batch.enrolledCount += 1;
      await batch.save();
    }

    // Create Initial Payment Receipt if initial payment > 0
    let receipt = null;
    if (initialPaid > 0) {
      const receiptNo = await generateReceiptNo();
      receipt = new UccPayment({
        receiptNo,
        studentId: student._id,
        studentRoll: student.roll,
        studentName: student.name,
        batchName: student.batchName,
        amount: initialPaid,
        paymentType: 'Admission',
        paymentMethod: paymentMethod || 'Cash',
        transactionId: transactionId || '',
        previousDue: finalFee,
        currentDue: totalDue,
        collector: collector || 'Admin'
      });
      await receipt.save();
    }

    res.status(201).json({
      success: true,
      message: 'Student admitted successfully',
      student,
      receipt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =================================================================
// 👥 2. STUDENTS LIST & PROFILE
// =================================================================

// Get Students List with Search & Filters
router.get('/students', async (req, res) => {
  try {
    const { search, batch, status, paymentStatus } = req.query;
    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (batch) query.batchName = batch;

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { studentId: new RegExp(search, 'i') },
        { roll: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { guardianPhone: new RegExp(search, 'i') }
      ];
    }

    const students = await UccStudent.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Single Student Profile with Full Financial & Distribution History
router.get('/students/:id', async (req, res) => {
  try {
    const student = await UccStudent.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payments = await UccPayment.find({ studentId: student._id }).sort({ paymentDate: -1 });
    const distributions = await UccDistribution.find({ studentId: student._id }).sort({ issuedDate: -1 });
    const results = await UccResult.find({ studentId: student._id }).populate('examId').sort({ createdAt: -1 });

    res.json({
      success: true,
      student,
      payments,
      distributions,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Material Distribution Override Permission for Student
router.put('/students/:id/override', async (req, res) => {
  try {
    const { distributionOverride, overrideApprovedBy, overrideReason } = req.body;
    const student = await UccStudent.findByIdAndUpdate(
      req.params.id,
      { distributionOverride, overrideApprovedBy, overrideReason },
      { new: true }
    );
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =================================================================
// 💰 3. PAYMENTS & DAILY STATEMENT
// =================================================================

// Collect Installment Payment
router.post('/payments', async (req, res) => {
  try {
    const { studentId, amount, paymentMethod, transactionId, collector, remarks } = req.body;
    
    const student = await UccStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const previousDue = student.totalDue;
    const currentDue = Math.max(0, previousDue - payAmount);
    const newTotalPaid = student.totalPaid + payAmount;

    let paymentStatus = 'Unpaid';
    if (currentDue === 0) {
      paymentStatus = 'Full Paid';
    } else if (newTotalPaid > 0) {
      paymentStatus = 'Partial Paid';
    }

    // Update Student Ledger
    student.totalPaid = newTotalPaid;
    student.totalDue = currentDue;
    student.paymentStatus = paymentStatus;
    await student.save();

    // Create Payment Receipt
    const receiptNo = await generateReceiptNo();
    const payment = new UccPayment({
      receiptNo,
      studentId: student._id,
      studentRoll: student.roll,
      studentName: student.name,
      batchName: student.batchName,
      amount: payAmount,
      paymentType: 'Installment',
      paymentMethod: paymentMethod || 'Cash',
      transactionId: transactionId || '',
      previousDue,
      currentDue,
      collector: collector || 'Admin',
      remarks: remarks || ''
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment collected successfully',
      payment,
      student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Daily Collection Statement Report
router.get('/payments/daily-statement', async (req, res) => {
  try {
    const { startDate, endDate, collector, paymentMethod } = req.query;
    let filter = {};

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        let end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    } else {
      // Default: Today's transactions
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      const endToday = new Date();
      endToday.setHours(23, 59, 59, 999);
      filter.paymentDate = { $gte: startToday, $lte: endToday };
    }

    if (collector) filter.collector = collector;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const payments = await UccPayment.find(filter).sort({ paymentDate: -1 });
    
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const count = payments.length;

    res.json({
      success: true,
      summary: {
        totalCollected,
        transactionCount: count
      },
      payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =================================================================
// 📚 4. MATERIAL INVENTORY & DISTRIBUTION
// =================================================================

// Get All Materials Catalog
router.get('/materials', async (req, res) => {
  try {
    const materials = await UccMaterial.find().sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add New Material to Catalog
router.post('/materials', async (req, res) => {
  try {
    const { materialCode, title, program, applicableBatches, stockQuantity } = req.body;
    const material = new UccMaterial({
      materialCode,
      title,
      program: program || 'All',
      applicableBatches: applicableBatches || [],
      stockQuantity: Number(stockQuantity) || 100
    });
    await material.save();
    res.status(201).json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check Student Eligibility for Material Distribution
router.get('/distribution/check-eligibility/:studentId', async (req, res) => {
  try {
    const student = await UccStudent.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const isEligible = student.totalDue === 0 || student.distributionOverride === true;
    const previousDistributions = await UccDistribution.find({ studentId: student._id });

    // Extract all items already issued to this student
    const issuedItemIds = [];
    previousDistributions.forEach(d => {
      d.items.forEach(item => {
        if (item.materialId) issuedItemIds.push(item.materialId.toString());
      });
    });

    res.json({
      success: true,
      student,
      isEligible,
      hasDue: student.totalDue > 0,
      distributionOverride: student.distributionOverride,
      issuedItemIds
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Issue Material Voucher
router.post('/distribution/issue', async (req, res) => {
  try {
    const { studentId, items, hasOverride, overrideReason, issuedBy } = req.body;
    
    const student = await UccStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'No items selected for distribution' });
    }

    const voucherNo = await generateVoucherNo();
    const distribution = new UccDistribution({
      voucherNo,
      studentId: student._id,
      studentRoll: student.roll,
      studentName: student.name,
      batchName: student.batchName,
      items,
      hasOverride: hasOverride || false,
      overrideReason: overrideReason || '',
      issuedBy: issuedBy || 'Admin'
    });

    await distribution.save();

    // Update stock quantity for each material
    for (let item of items) {
      if (item.materialId) {
        await UccMaterial.findByIdAndUpdate(item.materialId, {
          $inc: { stockQuantity: -1, distributedCount: 1 }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Materials issued successfully',
      distribution
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =================================================================
// 📑 5. BATCHES & EXAMS & MERIT LIST
// =================================================================

// Get Batches
router.get('/batches', async (req, res) => {
  try {
    const batches = await UccBatch.find().sort({ createdAt: -1 });
    res.json({ success: true, count: batches.length, batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Batch
router.post('/batches', async (req, res) => {
  try {
    const { batchCode, batchName, program, baseFee, capacity } = req.body;
    const batch = new UccBatch({
      batchCode,
      batchName,
      program,
      baseFee: Number(baseFee) || 15000,
      capacity: Number(capacity) || 60
    });
    await batch.save();
    res.status(201).json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Batch (Edit)
router.put('/batches/:id', async (req, res) => {
  try {
    const { batchCode, batchName, program, baseFee, capacity, status } = req.body;
    const batch = await UccBatch.findByIdAndUpdate(
      req.params.id,
      { batchCode, batchName, program, baseFee: Number(baseFee) || 15000, capacity: Number(capacity) || 60, status },
      { new: true, runValidators: true }
    );
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Batch
router.delete('/batches/:id', async (req, res) => {
  try {
    const batch = await UccBatch.findByIdAndDelete(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Exam
router.post('/exams', async (req, res) => {
  try {
    const { examCode, title, program, batchId, batchName, totalMarks, subjects } = req.body;
    const exam = new UccExam({
      examCode,
      title,
      program,
      batchId: batchId || null,
      batchName: batchName || '',
      totalMarks: Number(totalMarks) || 100,
      subjects: subjects || []
    });
    await exam.save();
    res.status(201).json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Entry Marks & Automatically Calculate Merit List Positions
router.post('/results/mark-entry', async (req, res) => {
  try {
    const { examId, markEntries } = req.body; // markEntries: [{ studentId, subjectMarks, totalObtained }]
    const exam = await UccExam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Save or update results for each student
    for (let entry of markEntries) {
      const student = await UccStudent.findById(entry.studentId);
      if (student) {
        const percentage = Math.round((entry.totalObtained / exam.totalMarks) * 100);
        await UccResult.findOneAndUpdate(
          { examId: exam._id, studentId: student._id },
          {
            studentRoll: student.roll,
            studentName: student.name,
            batchName: student.batchName,
            subjectMarks: entry.subjectMarks || [],
            totalObtained: entry.totalObtained,
            percentage,
            status: entry.totalObtained >= (exam.passMarks || 40) ? 'Pass' : 'Fail'
          },
          { upsert: true, new: true }
        );
      }
    }

    // Recalculate Merit Positions based on totalObtained descending
    const allResults = await UccResult.find({ examId: exam._id }).sort({ totalObtained: -1 });
    let rank = 1;
    for (let resDoc of allResults) {
      resDoc.meritPosition = rank++;
      await resDoc.save();
    }

    res.json({ success: true, message: 'Marks saved and Merit List generated successfully', count: allResults.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Merit List for an Exam
router.get('/results/merit-list/:examId', async (req, res) => {
  try {
    const exam = await UccExam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const meritList = await UccResult.find({ examId: exam._id }).sort({ meritPosition: 1 });
    res.json({ success: true, exam, meritList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =================================================================
// 📊 7. REPORTS & ANALYTICS
// =================================================================

// Comprehensive Reports Data for the Reports page
router.get('/reports', async (req, res) => {
  try {
    const { from, to, batch, method } = req.query;

    // Fetch all students
    let studentQuery = {};
    if (batch && batch !== 'all') studentQuery.batchName = batch;
    const students = await UccStudent.find(studentQuery).sort({ roll: 1 });

    // Fetch all payments with optional date/method filters
    let paymentFilter = {};
    if (from || to) {
      paymentFilter.paymentDate = {};
      if (from) paymentFilter.paymentDate.$gte = new Date(from);
      if (to) {
        let end = new Date(to);
        end.setHours(23, 59, 59, 999);
        paymentFilter.paymentDate.$lte = end;
      }
    }
    if (method && method !== 'all') paymentFilter.paymentMethod = method;
    if (batch && batch !== 'all') paymentFilter.batchName = batch;

    const payments = await UccPayment.find(paymentFilter).sort({ paymentDate: -1 });

    // Fetch all batches
    const batches = await UccBatch.find().sort({ createdAt: -1 });

    // Fetch all materials
    const materials = await UccMaterial.find().sort({ createdAt: -1 });

    // Fetch all distributions
    const distributions = await UccDistribution.find().sort({ issuedDate: -1 });

    // Build material stats: eligible students per material
    // A student is eligible for a material if their totalDue === 0 or they have distributionOverride
    const materialStats = materials.map(m => {
      // Find students in applicable batches or all students if no batch specified
      let eligibleStudents = [];
      if (m.applicableBatches && m.applicableBatches.length > 0) {
        eligibleStudents = students.filter(s => 
          m.applicableBatches.includes(s.batchName) && 
          (s.totalDue === 0 || s.distributionOverride === true)
        );
      } else {
        // If no specific batches, consider all students with no due or override
        eligibleStudents = students.filter(s => 
          s.totalDue === 0 || s.distributionOverride === true
        );
      }

      // Count issued copies for this material
      let issuedCount = 0;
      distributions.forEach(d => {
        d.items.forEach(item => {
          if (item.materialId && item.materialId.toString() === m._id.toString()) {
            issuedCount += item.quantity || 1;
          }
        });
      });

      // Fallback: use distributedCount from material model
      if (issuedCount === 0 && m.distributedCount > 0) {
        issuedCount = m.distributedCount;
      }

      return {
        _id: m._id,
        title: m.title,
        category: m.program || 'All',
        batch: m.applicableBatches && m.applicableBatches.length ? m.applicableBatches.join(', ') : 'All batches',
        limit: m.paymentThreshold || 0,
        eligible: eligibleStudents.length,
        issued: issuedCount,
        pending: Math.max(0, eligibleStudents.length - issuedCount),
        fulfillment: eligibleStudents.length ? Math.round(issuedCount / eligibleStudents.length * 100) : 0
      };
    });

    // Build batch summary with student financial data
    const batchSummary = batches.map(b => {
      const batchStudents = students.filter(s => s.batchName === b.batchName);
      const totalFee = batchStudents.reduce((a, s) => a + (s.finalFee || s.courseFee || 0), 0);
      const totalPaid = batchStudents.reduce((a, s) => a + (s.totalPaid || 0), 0);
      const totalDue = batchStudents.reduce((a, s) => a + (s.totalDue || 0), 0);
      const paidCount = batchStudents.filter(s => (s.totalDue || 0) === 0).length;
      const dueCount = batchStudents.filter(s => (s.totalDue || 0) > 0).length;
      const rate = totalFee ? Math.round(totalPaid / totalFee * 100) : 0;

      return {
        _id: b._id,
        id: b._id.toString(),
        name: b.batchName,
        batchName: b.batchName,
        batchCode: b.batchCode,
        category: b.program,
        program: b.program,
        session: b.startDate ? new Date(b.startDate).getFullYear().toString() : '2026',
        capacity: b.capacity || 60,
        coordinator: b.coordinator || '',
        startDate: b.startDate ? b.startDate.toISOString().split('T')[0] : '',
        endDate: b.endDate ? b.endDate.toISOString().split('T')[0] : '',
        admissionFee: b.admissionFee || 0,
        courseFee: b.baseFee || 0,
        baseFee: b.baseFee || 0,
        notes: b.notes || '',
        status: b.status || 'Active',
        enrolledCount: batchStudents.length,
        students: batchStudents.length,
        totalFee,
        totalPaid,
        totalDue,
        paidCount,
        dueCount,
        rate
      };
    });

    // Build student list with materials
    const studentList = students.map(s => {
      // Find distributions for this student
      const studentDistributions = distributions.filter(d => 
        d.studentId && d.studentId.toString() === s._id.toString()
      );
      
      // Extract material names
      const materialNames = [];
      studentDistributions.forEach(d => {
        d.items.forEach(item => {
          if (item.materialName) materialNames.push(item.materialName);
        });
      });

      return {
        _id: s._id,
        roll: s.roll,
        name: s.name,
        phone: s.phone,
        guardian: s.guardianPhone || '',
        guardianPhone: s.guardianPhone || '',
        batch: s.batchName,
        batchName: s.batchName,
        batchId: s.batchId,
        fee: s.finalFee || s.courseFee || 0,
        finalFee: s.finalFee || s.courseFee || 0,
        paid: s.totalPaid || 0,
        totalPaid: s.totalPaid || 0,
        due: s.totalDue || 0,
        totalDue: s.totalDue || 0,
        paymentStatus: s.paymentStatus || 'Unpaid',
        status: s.status || 'Active',
        active: s.status === 'Active',
        materials: materialNames,
        admissionDate: s.admissionDate ? s.admissionDate.toISOString().split('T')[0] : ''
      };
    });

    // Build transaction list
    const transactionList = payments.map(p => ({
      _id: p._id,
      date: p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : '',
      receipt: p.receiptNo,
      roll: p.studentRoll,
      studentName: p.studentName,
      batch: p.batchName,
      type: p.paymentType === 'Admission' ? 'Admission' : 'Payment',
      method: p.paymentMethod,
      amount: p.amount,
      collector: p.collector,
      transactionId: p.transactionId
    }));

    res.json({
      success: true,
      data: {
        students: studentList,
        transactions: transactionList,
        materials: materialStats,
        batches: batchSummary,
        distributions: distributions.map(d => ({
          _id: d._id,
          voucherNo: d.voucherNo,
          studentId: d.studentId,
          studentRoll: d.studentRoll,
          studentName: d.studentName,
          batchName: d.batchName,
          items: d.items,
          issuedBy: d.issuedBy,
          issuedDate: d.issuedDate ? d.issuedDate.toISOString().split('T')[0] : ''
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Single Student Ledger Data for Reports
router.get('/reports/students/:id', async (req, res) => {
  try {
    const student = await UccStudent.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const payments = await UccPayment.find({ studentId: student._id }).sort({ paymentDate: -1 });
    const distributions = await UccDistribution.find({ studentId: student._id }).sort({ issuedDate: -1 });

    // Extract material names from distributions
    const materialNames = [];
    distributions.forEach(d => {
      d.items.forEach(item => {
        if (item.materialName) materialNames.push(item.materialName);
      });
    });

    res.json({
      success: true,
      student: {
        _id: student._id,
        roll: student.roll,
        name: student.name,
        phone: student.phone,
        guardianPhone: student.guardianPhone || '',
        batch: student.batchName,
        batchName: student.batchName,
        fee: student.finalFee || student.courseFee || 0,
        paid: student.totalPaid || 0,
        due: student.totalDue || 0,
        paymentStatus: student.paymentStatus || 'Unpaid',
        materials: materialNames
      },
      payments: payments.map(p => ({
        _id: p._id,
        date: p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : '',
        receipt: p.receiptNo,
        method: p.paymentMethod,
        amount: p.amount,
        type: p.paymentType
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Student (for Batch-wise Report edit modal)
router.patch('/students/:roll', async (req, res) => {
  try {
    const { name, phone, guardianPhone, fee, batchId, materials } = req.body;
    
    const student = await UccStudent.findOne({ roll: req.params.roll });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (guardianPhone !== undefined) student.guardianPhone = guardianPhone;
    if (fee !== undefined) {
      student.finalFee = Number(fee);
      student.courseFee = Number(fee);
      student.totalDue = Math.max(0, Number(fee) - (student.totalPaid || 0));
    }
    if (batchId) {
      const batch = await UccBatch.findById(batchId);
      if (batch) {
        student.batchId = batch._id;
        student.batchName = batch.batchName;
      }
    }

    await student.save();
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Toggle Student Active Status
router.patch('/students/:roll/status', async (req, res) => {
  try {
    const { active } = req.body;
    const student = await UccStudent.findOne({ roll: req.params.roll });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    student.status = active ? 'Active' : 'Inactive';
    await student.save();
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =================================================================
// ⚙️ 6. SETTINGS
// =================================================================
router.get('/settings', async (req, res) => {
  try {
    let settings = await UccSettings.findOne();
    if (!settings) {
      settings = new UccSettings();
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    let settings = await UccSettings.findOne();
    if (!settings) {
      settings = new UccSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
