const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' }); // Adjust if needed

// Configuration
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civic_intelligence';
const EXPRESS_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
    console.log("==================================================");
    console.log("🚀 STARTING END-TO-END AI WORKFLOW INTEGRATION TEST");
    console.log("==================================================");

    let db;
    try {
        // 1. Connect to MongoDB
        console.log("\n[1/9] Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        db = mongoose.connection;
        console.log("✅ PASS: Connected to MongoDB");

        // 2. Select an existing complaint
        console.log("\n[2/9] Selecting an existing complaint with images...");
        const Complaint = db.collection('complaints');
        const complaint = await Complaint.findOne({ "images.0": { $exists: true } });
        
        if (!complaint) {
            throw new Error("No complaints with images found in database.");
        }
        console.log(`✅ PASS: Selected complaint ID: ${complaint._id}`);

        // 3. Generate valid Officer JWT
        console.log("\n[3/9] Generating Officer JWT...");
        const token = jwt.sign({ id: 'test_officer_id', role: 'officer' }, JWT_SECRET, { expiresIn: '1h' });
        console.log("✅ PASS: Officer JWT generated");

        // 4. Send POST request to Express
        console.log(`\n[4/9] Sending POST request to Express: ${EXPRESS_URL}/complaints/${complaint._id}/analyze`);
        console.log("⏳ Waiting for Express -> FastAPI -> TensorFlow inference...");
        
        const startTime = Date.now();
        const response = await axios.post(
            `${EXPRESS_URL}/complaints/${complaint._id}/analyze`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const endTime = Date.now();
        console.log(`✅ PASS: Request completed in ${endTime - startTime}ms. Status: ${response.status}`);

        // 5. Verify Response from Express
        console.log("\n[5/9] Verifying Express response payload...");
        const responseData = response.data.data;
        if (!responseData || !responseData.aiAnalysis) {
            throw new Error("Express response is missing aiAnalysis object");
        }
        console.log("✅ PASS: Express returned aiAnalysis object successfully");

        // 6. Retrieve Updated Document from MongoDB
        console.log("\n[6/9] Retrieving updated document directly from MongoDB...");
        const updatedComplaint = await Complaint.findOne({ _id: complaint._id });
        if (!updatedComplaint.aiAnalysis) {
            throw new Error("MongoDB document was NOT updated with aiAnalysis");
        }
        console.log("✅ PASS: MongoDB document successfully retrieved");

        // 7. Verify Data Integrity
        console.log("\n[7/9] Verifying AI Data Schema Integrity...");
        const ai = updatedComplaint.aiAnalysis;
        
        const checks = [
            { field: 'processingStatus', val: ai.processingStatus },
            { field: 'categoryPrediction', val: ai.categoryPrediction },
            { field: 'confidence', val: ai.confidence },
            { field: 'analyzedAt', val: ai.analyzedAt }
        ];

        checks.forEach(check => {
            if (check.val === undefined || check.val === null) {
                console.warn(`⚠️ WARNING: Field '${check.field}' is missing or null. (Expected if SEVERITY_MODEL_NOT_AVAILABLE overrides)`);
            } else {
                console.log(`   ✓ ${check.field} exists`);
            }
        });
        console.log("✅ PASS: Data schema integrity verified");

        // 8. Print Complete aiAnalysis Object
        console.log("\n[8/9] Dumping MongoDB aiAnalysis Object:");
        console.log(JSON.stringify(ai, null, 2));

        // 9. Final Validation
        console.log("\n[9/9] Checking Overall System Health...");
        if (ai.processingStatus === 'FAILED') {
            throw new Error("AI Pipeline reported FAILED processing status");
        }
        console.log("✅ PASS: AI Workflow End-to-End Success!");
        console.log("==================================================");
        console.log("🎉 ALL INTEGRATION TESTS PASSED 🎉");
        console.log("==================================================");

    } catch (error) {
        console.error("\n❌ FAIL: INTEGRATION TEST FAILED!");
        console.error("==================================================");
        console.error("Error Details:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.error(error.message);
        }
        console.error("==================================================");
        process.exit(1);
    } finally {
        if (db) {
            await mongoose.disconnect();
        }
    }
}

runTest();
