const mongoose = require('mongoose');
require('dotenv').config({path: '.env'});

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const db = mongoose.connection.db;
        console.log("Connected to DB.");
        const indexesBefore = await db.collection('complaints').indexes();
        console.log("Indexes before:", indexesBefore.map(i => i.name));
        
        await db.collection('complaints').createIndex({ location: '2dsphere' });
        console.log('Index created successfully.');
        
        const indexesAfter = await db.collection('complaints').indexes();
        console.log("Indexes after:", indexesAfter.map(i => i.name));
    } catch (e) {
        console.error("Error creating index:", e);
    } finally {
        process.exit(0);
    }
});
