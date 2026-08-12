// Import UCC Students from Excel file into MongoDB
// Reads from: c:/Users/mdtuh/Downloads/UCC_APP_cleaned.xlsx (Sheet: AllStudents)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const UccStudent = require('./models/UccStudent');
const UccBatch = require('./models/UccBatch');
const UccPayment = require('./models/UccPayment');

const EXCEL_PATH = 'c:/Users/mdtuh/Downloads/UCC_APP_cleaned.xlsx';
const SHEET_NAME = 'AllStudents';

// Batch configuration mapping
const BATCH_CONFIG = {
  'Science BN 1': { batchCode: 'SCI-BN1-2026', program: 'Science', baseFee: 18000 },
  'Humnities BN 1': { batchCode: 'HUM-BN1-2026', program: 'Humanities', baseFee: 17000 },
  'Business Studies BN 1': { batchCode: 'BUS-BN1-2026', program: 'Business Studies', baseFee: 18000 },
  'Exam BATCH B unit': { batchCode: 'EXM-B-2026', program: 'Exam Batch', baseFee: 5000 }
};

async function generateReceiptNo() {
  const count = await UccPayment.countDocuments();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `UCC-REC-2026-${nextNum}`;
}

async function importData() {
  try {
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[SHEET_NAME];
    
    if (!sheet) {
      console.error(`❌ Sheet "${SHEET_NAME}" not found in Excel file!`);
      console.log('Available sheets:', workbook.SheetNames);
      process.exit(1);
    }

    const rows = XLSX.utils.sheet_to_json(sheet);
    console.log(`✅ Found ${rows.length} students in "${SHEET_NAME}" sheet\n`);

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    // Group students by batch
    const batchGroups = {};
    for (const row of rows) {
      const batchName = (row['Batch Name'] || '').trim();
      if (!batchName) continue;
      if (!batchGroups[batchName]) batchGroups[batchName] = [];
      batchGroups[batchName].push(row);
    }

    console.log('📊 Batch distribution from Excel:');
    for (const [batchName, students] of Object.entries(batchGroups)) {
      console.log(`   - ${batchName}: ${students.length} students`);
    }
    console.log('');

    let totalStudents = 0;
    let totalPayments = 0;
    let skipped = 0;

    // Process each batch
    for (const [batchName, students] of Object.entries(batchGroups)) {
      const config = BATCH_CONFIG[batchName];
      if (!config) {
        console.log(`⚠️  Skipping unknown batch: "${batchName}" (no config found)`);
        skipped += students.length;
        continue;
      }

      // Find or create batch
      let batch = await UccBatch.findOne({ batchCode: config.batchCode });
      if (!batch) {
        batch = new UccBatch({
          batchCode: config.batchCode,
          batchName,
          program: config.program,
          baseFee: config.baseFee,
          capacity: 100,
          enrolledCount: 0,
          nextRollNumber: 1,
          status: 'Active'
        });
        await batch.save();
        console.log(`✅ Created new batch: ${batchName} (${config.batchCode})`);
      } else {
        console.log(`ℹ️  Batch already exists: ${batchName} (${config.batchCode})`);
      }

      // Process each student in this batch
      for (const row of students) {
        const roll = String(row['Roll'] || '').trim();
        const name = String(row['Name'] || '').trim();
        const phone = String(row['Phone'] || '').trim();
        const guardianPhone = String(row['Guardian Phone'] || '').trim();
        const totalFee = Number(row['Total Fee']) || config.baseFee;
        const discount = Number(row['Discount']) || 0;
        const payableAmount = Number(row['Payable Amount']) || (totalFee - discount);
        const totalPaid = Number(row['Total Paid']) || 0;
        const due = Number(row['Due']) || Math.max(0, payableAmount - totalPaid);
        const status = String(row['Status'] || '').trim();
        const discountRef = String(row['Discount Reference'] || '').trim();

        if (!roll || !name) {
          console.log(`⚠️  Skipping row with missing roll/name: ${JSON.stringify(row)}`);
          skipped++;
          continue;
        }

        // Check if student already exists
        const existing = await UccStudent.findOne({ roll, batchName });
        if (existing) {
          console.log(`⚠️  Student already exists: ${name} (Roll: ${roll}, Batch: ${batchName})`);
          skipped++;
          continue;
        }

        // Create studentId
        const studentId = `UCC-${config.batchCode}-${roll}`;

        // Determine payment status
        let paymentStatus = 'Unpaid';
        if (due === 0 && payableAmount > 0) {
          paymentStatus = 'Full Paid';
        } else if (totalPaid > 0) {
          paymentStatus = 'Partial Paid';
        }

        // Create student
        const student = new UccStudent({
          studentId,
          roll,
          name,
          phone: phone || 'N/A',
          guardianName: '',
          guardianPhone: guardianPhone === 'NO' ? '' : guardianPhone,
          batchId: batch._id,
          batchName,
          program: config.program,
          branch: 'Pabna',
          courseFee: totalFee,
          discountType: discount > 0 ? 'fixed' : 'none',
          discountValue: discount,
          discountAmount: discount,
          discountReference: discountRef,
          finalFee: payableAmount,
          totalPaid,
          totalDue: due,
          paymentStatus,
          status: 'Active',
          admissionDate: new Date()
        });

        await student.save();
        totalStudents++;

        // Create payment record if totalPaid > 0
        if (totalPaid > 0) {
          const receiptNo = await generateReceiptNo();
          const payment = new UccPayment({
            receiptNo,
            studentId: student._id,
            studentRoll: roll,
            studentName: name,
            batchName,
            amount: totalPaid,
            paymentType: 'Admission',
            paymentMethod: 'Cash',
            transactionId: '',
            previousDue: payableAmount,
            currentDue: due,
            collector: 'Import',
            remarks: `Imported from Excel (Discount: ${discount}, Ref: ${discountRef || 'N/A'})`,
            paymentDate: new Date()
          });
          await payment.save();
          totalPayments++;
        }

        console.log(`✅ Imported: ${name} (Roll: ${roll}, Batch: ${batchName}, Paid: ${totalPaid}, Due: ${due})`);
      }

      // Update batch enrolled count
      batch.enrolledCount = await UccStudent.countDocuments({ batchId: batch._id });
      await batch.save();
      console.log('');
    }

    console.log('\n══════════════════════════════════════');
    console.log('📊 IMPORT SUMMARY:');
    console.log('══════════════════════════════════════');
    console.log(`   ✅ Students imported: ${totalStudents}`);
    console.log(`   💰 Payment records created: ${totalPayments}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log('══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Connection closed');
    process.exit(0);
  }
}

importData();
