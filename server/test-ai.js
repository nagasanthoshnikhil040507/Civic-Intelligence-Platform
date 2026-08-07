const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testAI() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'citizen@civic.com',
      password: 'Password123!'
    });
    
    const token = loginRes.data.data.accessToken;
    const axiosInst = axios.create({
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Creating Complaint 1...');
    const createRes = await axiosInst.post('http://localhost:5000/api/v1/complaints', {
      title: 'Pile of Garbage on Main St',
      description: 'There is a huge pile of garbage blocking the sidewalk on Main St near the park.',
      category: 'Garbage',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610]
      }
    });

    console.log(createRes.data);
    const complaintId1 = createRes.data.data._id || createRes.data.data.complaint._id;
    console.log(`Complaint 1 created: ${complaintId1}`);

    // We need a dummy image
    const dummyImagePath = path.join(__dirname, 'dummy.png');

    console.log('Uploading image for Complaint 1 to trigger AI...');
    const form1 = new FormData();
    form1.append('images', fs.createReadStream(dummyImagePath));
    
    const uploadRes1 = await axiosInst.post(`http://localhost:5000/api/v1/complaints/${complaintId1}/images`, form1, {
      headers: {
        ...form1.getHeaders()
      }
    });

    console.log('Waiting 5 seconds for background AI analysis...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('Fetching Complaint 1 to check AI Analysis...');
    const getRes1 = await axiosInst.get(`http://localhost:5000/api/v1/complaints/${complaintId1}`);
    const comp1 = getRes1.data.data;
    console.log('AI Analysis for Complaint 1:');
    console.log(JSON.stringify(comp1.aiAnalysis, null, 2));
    console.log('Root fields for Complaint 1:', {
        priority: comp1.priority,
        severity: comp1.severity,
        garbageQuantity: comp1.garbageQuantity,
        confidenceScore: comp1.confidenceScore,
        linkedComplaintId: comp1.linkedComplaintId,
        reportCount: comp1.reportCount,
    });

    console.log('\n--- Now creating Duplicate Complaint ---\n');
    const createRes2 = await axiosInst.post('http://localhost:5000/api/v1/complaints', {
      title: 'Garbage blocking Main St sidewalk',
      description: 'A massive garbage pile is completely blocking the sidewalk on Main Street near the park entrance.',
      category: 'Garbage',
      location: {
        type: 'Point',
        coordinates: [-73.935242, 40.730610] // Exact same coords
      }
    });

    console.log(createRes2.data);
    const complaintId2 = createRes2.data.data._id || createRes2.data.data.complaint._id;
    console.log(`Complaint 2 created: ${complaintId2}`);

    const form2 = new FormData();
    form2.append('images', fs.createReadStream(dummyImagePath));
    
    const uploadRes2 = await axiosInst.post(`http://localhost:5000/api/v1/complaints/${complaintId2}/images`, form2, {
      headers: {
        ...form2.getHeaders()
      }
    });

    console.log('Waiting 5 seconds for background AI analysis...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('Fetching Complaint 2 to check AI Analysis...');
    const getRes2 = await axiosInst.get(`http://localhost:5000/api/v1/complaints/${complaintId2}`);
    const comp2 = getRes2.data.data;
    console.log('AI Analysis for Complaint 2 (Should be duplicate):');
    console.log(JSON.stringify(comp2.aiAnalysis, null, 2));
    console.log('Root fields for Complaint 2:', {
        priority: comp2.priority,
        severity: comp2.severity,
        garbageQuantity: comp2.garbageQuantity,
        confidenceScore: comp2.confidenceScore,
        linkedComplaintId: comp2.linkedComplaintId,
        reportCount: comp2.reportCount,
    });

    // Check Original Complaint to see if reportCount incremented
    const finalGetRes1 = await axiosInst.get(`http://localhost:5000/api/v1/complaints/${complaintId1}`);
    console.log(`\nOriginal Complaint (1) Report Count: ${finalGetRes1.data.data.reportCount}`);

  } catch (err) {
    console.error('Test failed:', err.response?.data || err.message);
  }
}

testAI();
