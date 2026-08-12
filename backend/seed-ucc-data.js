const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const UccBatch = require('./models/UccBatch');
const UccMaterial = require('./models/UccMaterial');
const UccStudent = require('./models/UccStudent');
const UccPayment = require('./models/UccPayment');
const UccSettings = require('./models/UccSettings');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms-database';

async function seedUccData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Seed UCC Batches
    console.log('🌱 Seeding UCC Batches...');
    const batchesData = [
      { batchCode: 'Medical-2026-A', batchName: 'Medical Admission 2026 (Batch A)', program: 'Medical', baseFee: 15000, capacity: 60 },
      { batchCode: 'Medical-2026-B', batchName: 'Medical Admission 2026 (Batch B)', program: 'Medical', baseFee: 15000, capacity: 60 },
      { batchCode: 'Engineering-2026', batchName: 'Engineering Admission 2026', program: 'Engineering', baseFee: 18000, capacity: 50 },
      { batchCode: 'Varsity-A-2026', batchName: 'Varsity Unit-A (Science) 2026', program: 'Varsity-A', baseFee: 12000, capacity: 60 },
      { batchCode: 'Varsity-B-2026', batchName: 'Varsity Unit-B (Arts) 2026', program: 'Varsity-B', baseFee: 10000, capacity: 60 },
      { batchCode: 'Varsity-C-2026', batchName: 'Varsity Unit-C (Commerce) 2026', program: 'Varsity-C', baseFee: 10000, capacity: 60 }
    ];

    for (let b of batchesData) {
      await UccBatch.findOneAndUpdate({ batchCode: b.batchCode }, b, { upsert: true });
    }
    console.log('✅ Batches seeded.');

    // 2. Seed UCC Material Catalog
    console.log('🌱 Seeding Material Catalog...');
    const materialsData = [
      { materialCode: 'MAT-MED-01', title: 'Medical Physics Special Lecture Sheet', program: 'Medical', stockQuantity: 150 },
      { materialCode: 'MAT-MED-02', title: 'Medical Chemistry Question Bank 2026', program: 'Medical', stockQuantity: 150 },
      { materialCode: 'MAT-MED-03', title: 'Biology Practice Sheet & Diagrams', program: 'Medical', stockQuantity: 150 },
      { materialCode: 'MAT-ENG-01', title: 'Engineering Higher Math Master Guide', program: 'Engineering', stockQuantity: 100 },
      { materialCode: 'MAT-ENG-02', title: 'Engineering Physics Formula Book', program: 'Engineering', stockQuantity: 100 },
      { materialCode: 'MAT-VAR-01', title: 'Varsity Unit-A Model Test Set', program: 'Varsity-A', stockQuantity: 120 }
    ];

    for (let m of materialsData) {
      await UccMaterial.findOneAndUpdate({ materialCode: m.materialCode }, m, { upsert: true });
    }
    console.log('✅ Materials catalog seeded.');

    // 3. Seed UCC Branch Settings
    console.log('🌱 Seeding UCC Branch Settings...');
    await UccSettings.findOneAndUpdate({}, {
      branchName: 'UCC পাবনা শাখা',
      address: 'আব্দুল হামিদ রোড, পাবনা',
      contactPhone: '01712-345678',
      receiptHeaderTitle: 'UCC ADMISSION & COACHING CENTER - PABNA BRANCH',
      receiptFooterTerms: 'Fees once paid are non-refundable and non-transferable.'
    }, { upsert: true });
    console.log('✅ Settings seeded.');

    // 4. Seed Initial Sample Students if collection is empty
    const studentCount = await UccStudent.countDocuments();
    if (studentCount === 0) {
      console.log('🌱 Seeding Initial Students...');
      const medBatch = await UccBatch.findOne({ batchCode: 'Medical-2026-A' });

      const student1 = new UccStudent({
        studentId: 'UCC-MED-26-001',
        roll: '001',
        name: 'তানভীর আহমেদ',
        phone: '01711223344',
        guardianPhone: '01811223344',
        batchId: medBatch ? medBatch._id : null,
        batchName: 'Medical Admission 2026 (Batch A)',
        program: 'Medical',
        courseFee: 15000,
        discountType: 'percentage',
        discountValue: 10,
        discountAmount: 1500,
        discountReference: 'Director Recommendation',
        finalFee: 13500,
        totalPaid: 8000,
        totalDue: 5500,
        paymentStatus: 'Partial Paid'
      });
      await student1.save();

      const receipt1 = new UccPayment({
        receiptNo: 'UCC-REC-2026-0001',
        studentId: student1._id,
        studentRoll: student1.roll,
        studentName: student1.name,
        batchName: student1.batchName,
        amount: 8000,
        paymentType: 'Admission',
        paymentMethod: 'Cash',
        previousDue: 13500,
        currentDue: 5500,
        collector: 'UCC Admin'
      });
      await receipt1.save();

      if (medBatch) {
        medBatch.enrolledCount = 1;
        medBatch.nextRollNumber = 2;
        await medBatch.save();
      }

      console.log('✅ Initial student & payment seeded.');
    }

    console.log('\n🎉 UCC Database setup and seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedUccData();
