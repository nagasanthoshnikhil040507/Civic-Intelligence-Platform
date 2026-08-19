const mongoose = require('mongoose');

async function audit() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://civic_admin:Santhosh1234@ac-iqjevtt-shard-00-00.lb4bxr6.mongodb.net:27017,ac-iqjevtt-shard-00-01.lb4bxr6.mongodb.net:27017,ac-iqjevtt-shard-00-02.lb4bxr6.mongodb.net:27017/civic_intelligence?ssl=true&replicaSet=atlas-mrk96q-shard-0&authSource=admin&appName=Cluster0');
    console.log('Connected.');
    
    const db = mongoose.connection.db;
    
    // Check total count
    const count = await db.collection('complaints').countDocuments();
    console.log('\n--- COLLECTION: complaints ---');
    console.log(`Total complaints: ${count}`);
    
    // Get last 3 complaints
    const latest = await db.collection('complaints').find().sort({_id: -1}).limit(3).toArray();
    console.log('\n--- LATEST COMPLAINTS ---');
    latest.forEach((c, i) => {
      console.log(`\n[Complaint ${i + 1}] ID: ${c._id}`);
      console.log(`Title: ${c.title}`);
      console.log(`Status: ${c.status}`);
      console.log(`AI Analysis:`, JSON.stringify(c.aiAnalysis, null, 2));
      console.log(`Created At: ${c.createdAt}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

audit();
