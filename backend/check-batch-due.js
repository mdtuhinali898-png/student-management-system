// Diagnostic: Per-batch due count for March 2026
require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Student = require('./models/Student');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        const year = 2026;
        const month = 'March';

        // Get all students
        const students = await Student.find({ status: 'Active' }).select('studentId name batch fee phone').lean();
        
        // Get March payments
        const marchPayments = await Payment.find({ year: year, month: month }).select('studentId amount month year').lean();

        // Build payment map for March
        const marchMap = {};
        marchPayments.forEach(p => {
            marchMap[p.studentId] = (marchMap[p.studentId] || 0) + (p.amount || 0);
        });

        // Per batch due count (Finance.js logic)
        const batchDue = {};
        const batchTotal = {};
        
        students.forEach(s => {
            const batch = s.batch || 'Unknown';
            batchTotal[batch] = (batchTotal[batch] || 0) + 1;
            
            const paid = marchMap[s.studentId] || 0;
            const fee = s.fee || 0;
            if (fee > 0 && paid < fee) {
                if (!batchDue[batch]) batchDue[batch] = [];
                batchDue[batch].push({ id: s.studentId, name: s.name, fee, paid });
            }
        });

        console.log('=== Per-batch March 2026 due counts (Finance.js logic) ===');
        Object.entries(batchTotal).forEach(([batch, total]) => {
            const due = batchDue[batch] || [];
            const paidCount = total - due.length;
            console.log(`  ${batch}: total=${total}, paid=${paidCount}, due=${due.length}`);
        });

        // Specifically look at "27 Batch 7 Sat"
        const targetBatch = '27 Batch 7 Sat';
        console.log(`\n=== ${targetBatch} detail ===`);
        
        const batchStudents = students.filter(s => s.batch === targetBatch);
        console.log(`Total in batch: ${batchStudents.length}`);
        
        const dueInBatch = (batchDue[targetBatch] || []);
        console.log(`Due in batch: ${dueInBatch.length}`);
        
        // Check students with payment but not enough
        console.log('\nStudents who paid some amount but still due:');
        dueInBatch.filter(s => s.paid > 0).forEach(s => {
            console.log(`  ${s.id} (${s.name}) fee=${s.fee} paid=${s.paid} due=${s.fee - s.paid}`);
        });

        // Check students with NO payment at all
        console.log('\nStudents with NO payment at all:');
        dueInBatch.filter(s => s.paid === 0).slice(0, 15).forEach(s => {
            console.log(`  ${s.id} (${s.name}) fee=${s.fee}`);
        });

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

diagnose();