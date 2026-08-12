// Cleanup script: Remove demo/test batches & associated data from UCC
// Keeps only the real imported batches (Science BN 1, Humnities BN 1, Business Studies BN 1, Exam BATCH B unit)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const DEMO_BATCH_NAMES = [
  'Medical Admission 2026 (Batch A)',
  'Medical Admission 2026 (Batch B)',
  'Engineering Admission 2026',
  'Varsity Unit-A (Science) 2026',
  'Varsity Unit-B (Arts) 2026',
  'Varsity Unit-C (Commerce) 2026'
];

async function cleanup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;

    // 1. Find demo batches
    const demoBatches = await db.collection('uccbatches').find({ batchName: { $in: DEMO_BATCH_NAMES } }).toArray();
    console.log(`📊 Found ${demoBatches.length} demo batches to delete:`);
    demoBatches.forEach(b => console.log(`   - ${b.batchName} (${b.batchCode})`));
    console.log('');

    if (demoBatches.length > 0) {
      const batchIds = demoBatches.map(b => b._id);
      const batchNames = demoBatches.map(b => b.batchName);

      // 2. Find students in those batches
      const demoStudents = await db.collection('uccstudents').find({ batchName: { $in: batchNames } }).toArray();
      console.log(`🎓 Found ${demoStudents.length} demo students to delete:`);
      demoStudents.forEach(s => console.log(`   - ${s.name} (Roll: ${s.roll}, Batch: ${s.batchName})`));

      const studentIds = demoStudents.map(s => s._id);

      // 3. Delete payments for those students
      if (studentIds.length > 0) {
        const payResult = await db.collection('uccpayments').deleteMany({ studentId: { $in: studentIds } });
        console.log(`\n💰 Deleted ${payResult.deletedCount} demo payment records`);
      }

      // 4. Delete the students
      if (studentIds.length > 0) {
        const stuResult = await db.collection('uccstudents').deleteMany({ _id: { $in: studentIds } });
        console.log(`✅ Deleted ${stuResult.deletedCount} demo students`);
      }

      // 5. Delete distributions for those students
      if (studentIds.length > 0) {
        const distResult = await db.collection('uccdistributions').deleteMany({ studentId: { $in: studentIds } });
        console.log(`📦 Deleted ${distResult.deletedCount} demo distributions`);
      }

      // 6. Delete the batches
      const batchResult = await db.collection('uccbatches').deleteMany({ _id: { $in: batchIds } });
      console.log(`🗑️  Deleted ${batchResult.deletedCount} demo batches`);

      // 7. Check if demo materials should be deleted
      // Demo materials are the seeded ones (MAT-MED-*, MAT-ENG-*, MAT-VAR-*)
      // But real students may need them, so we keep them but could mark them
    } else {
      console.log('ℹ️  No demo batches found!');
    }

    // 8. Show remaining data
    console.log('\n══════════════════════════════════════');
    console.log('📊 REMAINING UCC DATA:');
    console.log('══════════════════════════════════════');
    const remainingBatches = await db.collection('uccbatches').find().toArray();
    console.log(`\n📚 Remaining Batches (${remainingBatches.length}):`);
    remainingBatches.forEach(b => console.log(`   - ${b.batchName} (${b.batchCode})`));

    const remainingStudents = await db.collection('uccstudents').countDocuments();
    console.log(`\n👥 Remaining Students: ${remainingStudents}`);

    const remainingPayments = await db.collection('uccpayments').countDocuments();
    console.log(`💰 Remaining Payments: ${remainingPayments}`);

    console.log('\n══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('📦 Connection closed');
    process.exit(0);
  }
}

cleanup();
