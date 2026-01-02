const mongoose = require('mongoose');

// Connection strings
const LOCAL_URI = 'mongodb://localhost:27017/laundry-orders';
const CLOUD_URI = "mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority";

// Collections to migrate
const COLLECTIONS = ['users', 'orders', 'customers'];

async function migrateData() {
  let localConn, cloudConn;
  
  try {
    console.log('🚀 Starting Data Migration to MongoDB Atlas');
    console.log('═'.repeat(60));
    
    // Connect to local MongoDB
    console.log('\n📍 Step 1: Connecting to LOCAL MongoDB...');
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to local database');
    
    // Connect to cloud MongoDB
    console.log('\n☁️  Step 2: Connecting to CLOUD MongoDB Atlas...');
    cloudConn = await mongoose.createConnection(CLOUD_URI, {
      dbName: 'laundry-orders'
    }).asPromise();
    console.log('✅ Connected to cloud database');
    
    // Get list of collections from local DB
    console.log('\n📋 Step 3: Scanning local database...');
    const localCollections = await localConn.db.listCollections().toArray();
    const collectionNames = localCollections.map(c => c.name);
    console.log(`   Found ${collectionNames.length} collections:`, collectionNames.join(', '));
    
    // Migrate each collection
    console.log('\n🔄 Step 4: Migrating data...');
    let totalDocsMigrated = 0;
    
    for (const collectionName of collectionNames) {
      try {
        const localCollection = localConn.db.collection(collectionName);
        const cloudCollection = cloudConn.db.collection(collectionName);
        
        // Count documents in local
        const count = await localCollection.countDocuments();
        
        if (count === 0) {
          console.log(`   ⏭️  ${collectionName}: Empty, skipping`);
          continue;
        }
        
        console.log(`\n   📦 Migrating collection: ${collectionName}`);
        console.log(`      Local docs: ${count}`);
        
        // Get all documents
        const documents = await localCollection.find({}).toArray();
        
        // Clear cloud collection (fresh start)
        const existingCount = await cloudCollection.countDocuments();
        if (existingCount > 0) {
          console.log(`      Clearing ${existingCount} existing docs in cloud...`);
          await cloudCollection.deleteMany({});
        }
        
        // Insert into cloud
        if (documents.length > 0) {
          await cloudCollection.insertMany(documents);
          console.log(`      ✅ Migrated ${documents.length} documents`);
          totalDocsMigrated += documents.length;
        }
        
      } catch (error) {
        console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
      }
    }
    
    // Verify migration
    console.log('\n✅ Step 5: Verifying migration...');
    for (const collectionName of collectionNames) {
      const localCollection = localConn.db.collection(collectionName);
      const cloudCollection = cloudConn.db.collection(collectionName);
      
      const localCount = await localCollection.countDocuments();
      const cloudCount = await cloudCollection.countDocuments();
      
      const status = localCount === cloudCount ? '✅' : '⚠️ ';
      console.log(`   ${status} ${collectionName}: Local=${localCount}, Cloud=${cloudCount}`);
    }
    
    console.log('\n═'.repeat(60));
    console.log(`🎉 Migration Complete!`);
    console.log(`📊 Total documents migrated: ${totalDocsMigrated}`);
    console.log('═'.repeat(60));
    
    // Show what to do next
    console.log('\n📝 Next Steps:');
    console.log('1. Create/Update your .env file with:');
    console.log('   MONGODB_URI="mongodb+srv://Vercel-Admin-laundry-order-management:zJDQFtuf2xbTzoJC@laundry-order-managemen.nvjptop.mongodb.net/laundry-orders?retryWrites=true&w=majority"');
    console.log('\n2. Restart your server:');
    console.log('   pkill -f nodemon');
    console.log('   npm run dev');
    console.log('\n3. Test the application to ensure everything works!');
    
  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    // Close connections
    if (localConn) await localConn.close();
    if (cloudConn) await cloudConn.close();
    process.exit(0);
  }
}

// Run migration
console.log('\n⚠️  WARNING: This will OVERWRITE data in MongoDB Atlas!');
console.log('Press Ctrl+C within 3 seconds to cancel...\n');

setTimeout(() => {
  migrateData();
}, 3000);

