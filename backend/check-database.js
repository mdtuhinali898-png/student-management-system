// This script will check what's in your MongoDB database
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!\n');
        
        // Get the database name
        const dbName = mongoose.connection.name;
        console.log(`📊 Database Name: ${dbName}\n`);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📁 Collections in database:');
        console.log('==========================');
        
        if (collections.length === 0) {
            console.log('❌ No collections found in this database!');
        } else {
            for (const collection of collections) {
                console.log(`\n📄 Collection: ${collection.name}`);
                
                // Count documents in each collection
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                console.log(`   Count: ${count} documents`);
                
                // Show first few documents if any exist
                if (count > 0) {
                    const documents = await mongoose.connection.db.collection(collection.name).find().limit(3).toArray();
                    for (let i = 0; i < documents.length; i++) {
                        console.log(`\n   Document ${i + 1}:`);
                        console.log('   ', JSON.stringify(documents[i], null, 2).substring(0, 200) + '...');
                    }
                }
            }
        }
        
        // Check if there are other databases
        console.log('\n\n🔍 Checking for other databases...');
        const adminDb = mongoose.connection.db.admin();
        const allDatabases = await adminDb.listDatabases();
        
        console.log('\n📊 All databases on this cluster:');
        console.log('===================================');
        allDatabases.databases.forEach(db => {
            console.log(`   - ${db.name}`);
        });
        
        console.log('\n\n💡 TIP: If your data is in a different database, update backend/.env');
        console.log('   Change MONGODB_URI to point to the correct database\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n📦 Connection closed');
        process.exit(0);
    }
}

checkDatabase();