require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 })
  .then(async () => {
    const db = mongoose.connection.db;

    // Get all batches with their fees
    const batches = await db.collection('batches').find({}).toArray();
    console.log(`Found ${batches.length} batches\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const batch of batches) {
      if (!batch.fee || batch.fee <= 0) {
        console.log(`⚠️  Batch "${batch.name}" has no fee set — skipping`);
        continue;
      }

      // Update all students in this batch where fee = 0
      const result = await db.collection('students').updateMany(
        { batch: batch.name, $or: [{ fee: 0 }, { fee: null }, { fee: { $exists: false } }] },
        { $set: { fee: batch.fee } }
      );

      console.log(`✅ Batch "${batch.name}" (fee: ${batch.fee}) → Updated ${result.modifiedCount} students`);
      totalUpdated += result.modifiedCount;
    }

    // Verify
    const zeroFeeLeft = await db.collection('students').countDocuments({ fee: 0 });
    const withFee     = await db.collection('students').countDocuments({ fee: { $gt: 0 } });

    console.log(`\n📊 Result:`);
    console.log(`  Updated: ${totalUpdated} students`);
    console.log(`  Students with fee > 0: ${withFee}`);
    console.log(`  Students still fee=0:  ${zeroFeeLeft}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  })
  .catch(e => { console.error('FAILED:', e.message); process.exit(1); });
