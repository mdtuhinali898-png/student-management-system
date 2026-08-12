const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Expense = require('./models/Expense');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms-database';

async function fixData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Fix Payments
        console.log('\n📊 Processing Payments...');
        const payments = await Payment.find({});
        let paymentFixed = 0;
        let paymentSkipped = 0;
        
        for (const payment of payments) {
            let needsUpdate = false;
            const updateData = {};
            
            // Check if month or year is missing
            if (!payment.month || !payment.year) {
                if (payment.date) {
                    const dateObj = new Date(payment.date);
                    
                    if (!payment.month) {
                        updateData.month = dateObj.toLocaleString('default', { month: 'long' });
                        needsUpdate = true;
                    }
                    
                    if (!payment.year) {
                        updateData.year = dateObj.getFullYear();
                        needsUpdate = true;
                    }
                }
            }
            
            if (needsUpdate) {
                await Payment.findByIdAndUpdate(payment._id, updateData);
                console.log(`  ✅ Fixed payment ${payment.receiptNo || payment._id}: Added month="${updateData.month}", year=${updateData.year}`);
                paymentFixed++;
            } else {
                paymentSkipped++;
            }
        }
        
        console.log(`  📈 Payments processed: ${payments.length}`);
        console.log(`  ✅ Fixed: ${paymentFixed}`);
        console.log(`  ⏭️  Skipped (already had data): ${paymentSkipped}`);
        
        // Fix Expenses
        console.log('\n💰 Processing Expenses...');
        const expenses = await Expense.find({});
        let expenseFixed = 0;
        let expenseSkipped = 0;
        
        for (const expense of expenses) {
            let needsUpdate = false;
            const updateData = {};
            
            // Check if month or year is missing
            if (!expense.month || !expense.year) {
                if (expense.date) {
                    const dateObj = new Date(expense.date);
                    
                    if (!expense.month) {
                        updateData.month = dateObj.toLocaleString('default', { month: 'long' });
                        needsUpdate = true;
                    }
                    
                    if (!expense.year) {
                        updateData.year = dateObj.getFullYear();
                        needsUpdate = true;
                    }
                }
            }
            
            if (needsUpdate) {
                await Expense.findByIdAndUpdate(expense._id, updateData);
                console.log(`  ✅ Fixed expense ${expense.expenseId || expense._id}: Added month="${updateData.month}", year=${updateData.year}`);
                expenseFixed++;
            } else {
                expenseSkipped++;
            }
        }
        
        console.log(`  📈 Expenses processed: ${expenses.length}`);
        console.log(`  ✅ Fixed: ${expenseFixed}`);
        console.log(`  ⏭️  Skipped (already had data): ${expenseSkipped}`);
        
        console.log('\n✨ Fix completed successfully!');
        
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run the fix
fixData();