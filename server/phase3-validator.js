const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = 'http://localhost:5000/api/v1';

async function validatePhase3() {
  console.log('============================================');
  console.log('   PHASE 3 END-TO-END VALIDATION SCRIPT');
  console.log('============================================\n');

  try {
    // Connect to DB for manual manipulations
    await mongoose.connect(process.env.MONGODB_URI);
    const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }));
    console.log('[+] Connected to MongoDB for test manipulations.');

    // Login
    console.log('[+] Logging in as Citizen...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'citizen@civic.com',
      password: 'Password123!'
    });
    const token = loginRes.data.data.accessToken;
    const axiosInst = axios.create({ headers: { Authorization: `Bearer ${token}` } });
    console.log('[+] Citizen logged in successfully.\n');

    const dummyImagePath = path.join(__dirname, 'dummy.png');
    const whiteImagePath = path.join(__dirname, 'white.png');

    // ---------------------------------------------------------
    // TEST 1: Citizen uploads a garbage image
    // ---------------------------------------------------------
    console.log('--- TEST 1: Normal Garbage Image ---');
    const createRes1 = await axiosInst.post(`${API_URL}/complaints`, {
      title: 'Garbage T1',
      description: 'Standard garbage pile.',
      category: 'Garbage',
      location: { type: 'Point', coordinates: [0, 0] }
    });
    const c1_id = createRes1.data.data._id || createRes1.data.data.complaint._id;
    console.log(`[T1] Created Complaint: ${c1_id}`);
    
    let form = new FormData();
    form.append('images', fs.createReadStream(dummyImagePath));
    await axiosInst.post(`${API_URL}/complaints/${c1_id}/images`, form, { headers: form.getHeaders() });
    
    console.log('[T1] Waiting for AI Analysis...');
    await new Promise(r => setTimeout(r, 8000));
    let get1 = (await axiosInst.get(`${API_URL}/complaints/${c1_id}`)).data.data;
    
    console.log('[T1] AI Analysis:', get1.aiAnalysis);
    console.log('[T1] Root Fields:', { priority: get1.priority, severity: get1.severity, quantity: get1.garbageQuantity });
    if (get1.aiAnalysis.garbageDetected === true && get1.aiAnalysis.duplicateDetected === false) {
      console.log('✅ TEST 1 PASSED');
    } else {
      console.error('❌ TEST 1 FAILED');
    }

    // ---------------------------------------------------------
    // TEST 2: Second citizen uploads the same garbage at same location
    // ---------------------------------------------------------
    console.log('\n--- TEST 2: Duplicate Upload ---');
    const createRes2 = await axiosInst.post(`${API_URL}/complaints`, {
      title: 'Garbage T2',
      description: 'Standard garbage pile.', // High text similarity
      category: 'Garbage',
      location: { type: 'Point', coordinates: [0, 0] } // Same coords
    });
    const c2_id = createRes2.data.data._id || createRes2.data.data.complaint._id;
    
    form = new FormData();
    form.append('images', fs.createReadStream(dummyImagePath));
    await axiosInst.post(`${API_URL}/complaints/${c2_id}/images`, form, { headers: form.getHeaders() });
    
    console.log('[T2] Waiting for AI Analysis...');
    await new Promise(r => setTimeout(r, 8000));
    let get2 = (await axiosInst.get(`${API_URL}/complaints/${c2_id}`)).data.data;
    let get1_updated = (await axiosInst.get(`${API_URL}/complaints/${c1_id}`)).data.data;
    
    console.log('[T2] Duplicate Detected:', get2.aiAnalysis.duplicateDetected);
    console.log('[T2] Linked Complaint:', get2.linkedComplaintId);
    console.log('[T2] Priority:', get2.priority, '| Confidence:', get2.confidenceScore);
    console.log('[T2] Original Complaint Report Count:', get1_updated.reportCount);
    
    if (get2.aiAnalysis.duplicateDetected && get2.linkedComplaintId === c1_id && get1_updated.reportCount === 2) {
      console.log('✅ TEST 2 PASSED');
    } else {
      console.error('❌ TEST 2 FAILED');
    }

    // ---------------------------------------------------------
    // TEST 3: Same image more than 30 meters away
    // ---------------------------------------------------------
    console.log('\n--- TEST 3: > 30m Distance ---');
    const createRes3 = await axiosInst.post(`${API_URL}/complaints`, {
      title: 'Garbage T3',
      description: 'Standard garbage pile.',
      category: 'Garbage',
      // Coordinates changed significantly
      location: { type: 'Point', coordinates: [1, 1] }
    });
    const c3_id = createRes3.data.data._id || createRes3.data.data.complaint._id;
    
    form = new FormData();
    form.append('images', fs.createReadStream(dummyImagePath));
    await axiosInst.post(`${API_URL}/complaints/${c3_id}/images`, form, { headers: form.getHeaders() });
    
    console.log('[T3] Waiting for AI Analysis...');
    await new Promise(r => setTimeout(r, 8000));
    let get3 = (await axiosInst.get(`${API_URL}/complaints/${c3_id}`)).data.data;
    
    console.log('[T3] Duplicate Detected:', get3.aiAnalysis.duplicateDetected);
    if (!get3.aiAnalysis.duplicateDetected) {
      console.log('✅ TEST 3 PASSED');
    } else {
      console.error('❌ TEST 3 FAILED (Incorrectly matched as duplicate)');
    }

    // ---------------------------------------------------------
    // TEST 4: Same image after more than 24 hours
    // ---------------------------------------------------------
    console.log('\n--- TEST 4: > 24 Hours Later ---');
    const createRes4A = await axiosInst.post(`${API_URL}/complaints`, {
      title: 'Garbage T4 Old',
      description: 'Standard garbage pile.',
      category: 'Garbage',
      location: { type: 'Point', coordinates: [2, 2] }
    });
    const c4a_id = createRes4A.data.data._id || createRes4A.data.data.complaint._id;
    form = new FormData();
    form.append('images', fs.createReadStream(dummyImagePath));
    await axiosInst.post(`${API_URL}/complaints/${c4a_id}/images`, form, { headers: form.getHeaders() });
    console.log(`[T4] Created old complaint: ${c4a_id}`);
    
    console.log('[T4] Modifying DB to simulate 48 hours ago...');
    await new Promise(r => setTimeout(r, 8000)); // wait for AI to finish first
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await Complaint.updateOne({ _id: new mongoose.Types.ObjectId(c4a_id) }, { $set: { createdAt: fortyEightHoursAgo } });
    
    const createRes4B = await axiosInst.post(`${API_URL}/complaints`, {
      title: 'Garbage T4 New',
      description: 'Standard garbage pile.',
      category: 'Garbage',
      location: { type: 'Point', coordinates: [2, 2] } // Same coords as Old
    });
    const c4b_id = createRes4B.data.data._id || createRes4B.data.data.complaint._id;
    form = new FormData();
    form.append('images', fs.createReadStream(dummyImagePath));
    await axiosInst.post(`${API_URL}/complaints/${c4b_id}/images`, form, { headers: form.getHeaders() });
    
    console.log('[T4] Waiting for AI Analysis on new complaint...');
    await new Promise(r => setTimeout(r, 8000));
    let get4b = (await axiosInst.get(`${API_URL}/complaints/${c4b_id}`)).data.data;
    
    console.log('[T4] Duplicate Detected:', get4b.aiAnalysis.duplicateDetected);
    if (!get4b.aiAnalysis.duplicateDetected) {
      console.log('✅ TEST 4 PASSED');
    } else {
      console.error('❌ TEST 4 FAILED (Incorrectly matched as duplicate despite >24h age)');
    }

    // ---------------------------------------------------------
    // TEST 5: Non-garbage image
    // ---------------------------------------------------------
    console.log('\n--- TEST 5: Non-Garbage Image ---');
    const createRes5 = await axiosInst.post(`${API_URL}/complaints`, {
      title: 'Clean street',
      description: 'This street is completely clean with no garbage.',
      category: 'Garbage',
      location: { type: 'Point', coordinates: [3, 3] }
    });
    const c5_id = createRes5.data.data._id || createRes5.data.data.complaint._id;
    
    form = new FormData();
    form.append('images', fs.createReadStream(whiteImagePath));
    await axiosInst.post(`${API_URL}/complaints/${c5_id}/images`, form, { headers: form.getHeaders() });
    
    console.log('[T5] Waiting for AI Analysis...');
    await new Promise(r => setTimeout(r, 8000));
    let get5 = (await axiosInst.get(`${API_URL}/complaints/${c5_id}`)).data.data;
    
    console.log('[T5] Garbage Detected:', get5.aiAnalysis.garbageDetected);
    if (get5.aiAnalysis.garbageDetected === false) {
      console.log('✅ TEST 5 PASSED');
    } else {
      console.error('❌ TEST 5 FAILED');
    }

  } catch (err) {
    console.error('Fatal Test Error:', err.response?.data || err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nValidation Complete.');
  }
}

validatePhase3();
