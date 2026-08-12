// Temporary script to check Payment month data
require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Check distinct months
        const months = await Payment.distinct('month');
        console.log('\n=== Distinct month values in Payment ===');
        console.log(months);
        
        // Check distinct years
        const years = await Payment.distinct('year');
        console.log('\n=== Distinct year values in Payment ===');
        console.log(years);
        
        // Check distinct types
        const types = await Payment.distinct('type');
        console.log('\n=== Distinct type values in Payment ===');
        console.log(types);
        
        // Sample payments
        const samples = await Payment.find().select('studentId amount month year type status').limit(10).lean();
        console.log('\n=== Sample payments ===');
        samples.forEach(s => console.log(JSON.stringify(s)));
        
        // Count payments for March 2026
        const marchCount = await Payment.countDocuments({ month: 'March', year: 2026 });
        console.log('\n=== March 2026 payment count:', marchCount);
        
        // Count all payments for 2026
        const yearCount = await Payment.countDocuments({ year: 2026 });
        console.log('=== 2026 payment count:', yearCount);
        
        // Count Monthly type for 2026
        const monthlyCount = await Payment.countDocuments({ year: 2026, type: 'Monthly' });
        console.log('=== 2026 Monthly type count:', monthlyCount);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

check();