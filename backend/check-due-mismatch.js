// Diagnostic: Compare reports.js logic vs finance.js logic for March 2026
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
        const students = await Student.find({ status: 'Active' }).select('studentId name batch fee').lean();
        console.log(`Total active students: ${students.length}`);

        // Get batch breakdown
        const batchCount = {};
        students.forEach(s => { batchCount[s.batch] = (batchCount[s.batch] || 0) + 1; });
        console.log('\n=== Batch breakdown ===');
        Object.entries(batchCount).forEach(([batch, count]) => console.log(`  ${batch}: ${count} students`));

        // Get March payments
        const marchPayments = await Payment.find({ year: year, month: month }).select('studentId amount month year type').lean();
        console.log(`\n=== March ${year} payments: ${marchPayments.length} ===`);

        // Build payment map for March
        const marchMap = {};
        marchPayments.forEach(p => {
            marchMap[p.studentId] = (marchMap[p.studentId] || 0) + (p.amount || 0);
        });

        // Reports.js logic: Paid if monthPayments.length > 0 && totalPaid >= fee
        const reportPaid = [];
        const reportDue = [];
        students.forEach(s => {
            const paid = marchMap[s.studentId] || 0;
            const fee = s.fee || 0;
            const hasPayment = (marchMap[s.studentId] !== undefined);
            if (hasPayment && (fee === 0 || paid >= fee)) {
                reportPaid.push({ id: s.studentId, name: s.name, batch: s.batch, fee, paid });
            } else {
                reportDue.push({ id: s.studentId, name: s.name, batch: s.batch, fee, paid });
            }
        });
        console.log(`\n=== Reports.js Logic (Paid if hasPayment && paid >= fee) ===`);
        console.log(`Paid: ${reportPaid.length}, Due: ${reportDue.length}`);

        // Finance.js logic: due if paid < fee
        const financeDue = [];
        students.forEach(s => {
            const paid = marchMap[s.studentId] || 0;
            const fee = s.fee || 0;
            if (fee > 0 && paid < fee) {
                financeDue.push({ id: s.studentId, name: s.name, batch: s.batch, fee, paid });
            }
        });
        console.log(`\n=== Finance.js Logic (due if fee > 0 && paid < fee) ===`);
        console.log(`Due: ${financeDue.length}`);

        // Check students with fee = 0
        const zeroFeeStudents = students.filter(s => (s.fee || 0) <= 0);
        console.log(`\n=== Students with fee <= 0: ${zeroFeeStudents.length} ===`);
        zeroFeeStudents.slice(0, 5).forEach(s => console.log(`  ${s.studentId} (${s.batch}) fee=${s.fee}`));

        // Check students counted as due in finance but paid in reports
        const reportDueIds = new Set(reportDue.map(s => s.id));
        const financeDueIds = new Set(financeDue.map(s => s.id));
        
        const inFinanceNotReport = [...financeDueIds].filter(id => !reportDueIds.has(id));
        const inReportNotFinance = [...reportDueIds].filter(id => !financeDueIds.has(id));
        
        console.log(`\n=== Students due in finance but NOT in reports: ${inFinanceNotReport.length} ===`);
        inFinanceNotReport.slice(0, 10).forEach(id => {
            const s = students.find(x => x.studentId === id);
            const paid = marchMap[id] || 0;
            console.log(`  ${id} (${s ? s.batch : '?'}) fee=${s ? s.fee : '?'} paid=${paid}`);
        });

        console.log(`\n=== Students due in reports but NOT in finance: ${inReportNotFinance.length} ===`);
        inReportNotFinance.slice(0, 10).forEach(id => {
            const s = students.find(x => x.studentId === id);
            const paid = marchMap[id] || 0;
            console.log(`  ${id} (${s ? s.batch : '?'}) fee=${s ? s.fee : '?'} paid=${paid}`);
        });

        // Check if March payments include Admission type
        const marchAdmission = marchPayments.filter(p => p.type === 'Admission');
        console.log(`\n=== March payments with type='Admission': ${marchAdmission.length} ===`);
        marchAdmission.slice(0, 5).forEach(p => console.log(`  ${p.studentId} amount=${p.amount}`));

        // Check payment types distribution for March
        const typeDist = {};
        marchPayments.forEach(p => { typeDist[p.type] = (typeDist[p.type] || 0) + 1; });
        console.log(`\n=== March payment types: ${JSON.stringify(typeDist)} ===`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

diagnose();