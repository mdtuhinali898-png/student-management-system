const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sms');
        const Payment = require('./models/Payment');
        const Student = require('./models/Student');
        
        const payments = await Payment.find().limit(3).lean();
        const students = await Student.find().limit(3).lean();
        const paymentCount = await Payment.countDocuments();
        const studentCount = await Student.countDocuments();
        
        console.log('=== PAYMENT COUNT:', paymentCount, '===');
        console.log('Sample payments:', JSON.stringify(payments, null, 2));
        console.log('\n=== STUDENT COUNT:', studentCount, '===');
        console.log('Sample students:', JSON.stringify(students, null, 2));
        
        // Check field names in payments
        if (payments.length > 0) {
            const p = payments[0];
            console.log('\n=== PAYMENT FIELD NAMES ===');
            console.log('Keys:', Object.keys(p));
            console.log('Has amount:', 'amount' in p, '| Has paid:', 'paid' in p);
            console.log('Has paymentMethod:', 'paymentMethod' in p, '| Has method:', 'method' in p);
            console.log('Has receiptNo:', 'receiptNo' in p, '| Has receipt:', 'receipt' in p);
            console.log('Has month:', 'month' in p, '| Has year:', 'year' in p);
            console.log('Has date:', 'date' in p);
            console.log('Has fee:', 'fee' in p);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
check();