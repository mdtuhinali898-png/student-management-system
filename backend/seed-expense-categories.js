const mongoose = require('mongoose');
const ExpenseCategory = require('./models/ExpenseCategory');
require('dotenv').config({ path: './.env' });

const defaultCategories = [
    {
        name: 'Salary & Wages',
        description: 'Staff salaries and wages',
        subCategories: [
            { name: 'Teacher Salary' },
            { name: 'Office Staff Salary' },
            { name: 'Accountant Salary' },
            { name: 'Guard Salary' },
            { name: 'Cleaner Salary' }
        ]
    },
    {
        name: 'Utilities',
        description: 'Electricity, water, internet bills',
        subCategories: [
            { name: 'Electricity Bill' },
            { name: 'Water Bill' },
            { name: 'Internet Bill' },
            { name: 'Gas Bill' },
            { name: 'Phone Bill' }
        ]
    },
    {
        name: 'Rent & Maintenance',
        description: 'Property rent and maintenance costs',
        subCategories: [
            { name: 'Building Rent' },
            { name: 'Office Maintenance' },
            { name: 'Equipment Repair' },
            { name: 'Furniture Repair' }
        ]
    },
    {
        name: 'Marketing & Advertising',
        description: 'Marketing and promotional expenses',
        subCategories: [
            { name: 'Digital Marketing' },
            { name: 'Print Media' },
            { name: 'Billboards' },
            { name: 'Promotional Materials' }
        ]
    },
    {
        name: 'Office Supplies',
        description: 'Office stationery and supplies',
        subCategories: [
            { name: 'Stationery' },
            { name: 'Printer Ink & Toner' },
            { name: 'Paper & Files' },
            { name: 'Office Equipment' }
        ]
    },
    {
        name: 'Transportation',
        description: 'Vehicle and transport expenses',
        subCategories: [
            { name: 'Fuel' },
            { name: 'Vehicle Maintenance' },
            { name: 'Parking' },
            { name: 'Driver Salary' }
        ]
    },
    {
        name: 'Student Welfare',
        description: 'Student-related expenses',
        subCategories: [
            { name: 'Study Materials' },
            { name: 'Exam Stationery' },
            { name: 'Scholarships' },
            { name: 'Student Events' }
        ]
    },
    {
        name: 'Professional Services',
        description: 'Legal, accounting and consulting fees',
        subCategories: [
            { name: 'Legal Fees' },
            { name: 'Accounting Services' },
            { name: 'Consulting Fees' },
            { name: 'Audit Fees' }
        ]
    },
    {
        name: 'Technology & Software',
        description: 'IT infrastructure and software',
        subCategories: [
            { name: 'Software Licenses' },
            { name: 'Hardware' },
            { name: 'IT Support' },
            { name: 'Web Hosting' }
        ]
    },
    {
        name: 'Miscellaneous',
        description: 'Other operational expenses',
        subCategories: [
            { name: 'Tea & Snacks' },
            { name: 'Donations' },
            { name: 'Bank Charges' },
            { name: 'Other' }
        ]
    }
];

async function seedCategories() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms-database';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Clear existing categories
        await ExpenseCategory.deleteMany({});
        console.log('🗑️  Cleared existing categories');
        
        // Insert default categories
        const result = await ExpenseCategory.insertMany(defaultCategories);
        console.log(`✅ Added ${result.length} default expense categories`);
        
        // Display categories
        console.log('\n📋 Default Categories Created:');
        result.forEach(cat => {
            console.log(`  • ${cat.name} (${cat.subCategories.length} sub-categories)`);
        });
        
        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();