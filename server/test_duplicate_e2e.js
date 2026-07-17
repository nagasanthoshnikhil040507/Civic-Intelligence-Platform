const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const mongoose = require('mongoose');

async function test() {
  try {
    const email = 'test_dup_e2e_' + Date.now() + '@example.com';
    console.log('1. Registering & Logging in:', email);
    
    await axios.post('http://localhost:5000/api/v1/auth/register', {
      firstName: 'Dup',
      lastName: 'Test',
      email: email,
      password: 'Password123!',
      role: 'citizen'
    });
    
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: email,
      password: 'Password123!'
    });
    const token = loginRes.data.data.accessToken;

    console.log('2. Creating Complaint A (Original)');
    const complaintA = await axios.post('http://localhost:5000/api/v1/complaints', {
      title: 'Original Duplicate Test',
      description: 'This is the first complaint for duplicate testing.',
      category: 'infrastructure',
      location: { type: 'Point', coordinates: [78.4867, 17.3850] }
    }, { headers: { Authorization: 'Bearer ' + token } });
    
    const idA = complaintA.data.data._id;
    console.log('   Complaint A ID:', idA);

    console.log('3. Uploading image to Complaint A');
    // We use a predefined test image if possible, or just download a dummy image to send twice.
    const dummyImage = await axios.get('https://picsum.photos/200/300', { responseType: 'arraybuffer' });
    fs.writeFileSync('test_dup_image.jpg', dummyImage.data);
    
    const formA = new FormData();
    formA.append('images', fs.createReadStream('test_dup_image.jpg'));
    
    await axios.post('http://localhost:5000/api/v1/complaints/' + idA + '/images', formA, {
      headers: { ...formA.getHeaders(), Authorization: 'Bearer ' + token }
    });
    
    console.log('4. Waiting for AI to process Complaint A (10s)...');
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('5. Creating Complaint B (Duplicate)');
    const complaintB = await axios.post('http://localhost:5000/api/v1/complaints', {
      title: 'Duplicate Test Copy',
      description: 'This is the second complaint for duplicate testing.',
      category: 'infrastructure',
      location: { type: 'Point', coordinates: [78.4868, 17.3851] } // Nearly identical
    }, { headers: { Authorization: 'Bearer ' + token } });
    
    const idB = complaintB.data.data._id;
    console.log('   Complaint B ID:', idB);

    console.log('6. Uploading IDENTICAL image to Complaint B');
    const formB = new FormData();
    formB.append('images', fs.createReadStream('test_dup_image.jpg'));
    
    await axios.post('http://localhost:5000/api/v1/complaints/' + idB + '/images', formB, {
      headers: { ...formB.getHeaders(), Authorization: 'Bearer ' + token }
    });
    
    console.log('7. Waiting for AI to process Complaint B (10s)...');
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('8. Verifying Complaint B AI Analysis');
    const verifyRes = await axios.get('http://localhost:5000/api/v1/complaints/' + idB, {
      headers: { Authorization: 'Bearer ' + token }
    });
    
    const aiAnalysis = verifyRes.data.data.aiAnalysis;
    console.log(JSON.stringify(aiAnalysis, null, 2));
    
    if (aiAnalysis && aiAnalysis.duplicateDetected === true && aiAnalysis.matchedComplaintId === idA) {
      console.log('PASS: Duplicate successfully detected!');
      console.log('Similarity score:', aiAnalysis.similarity);
    } else {
      console.log('FAIL: Duplicate not detected properly.');
    }
  } catch (err) {
    console.error('Test Failed:', err.response ? err.response.data : err.message);
  } finally {
    if (fs.existsSync('test_dup_image.jpg')) {
      fs.unlinkSync('test_dup_image.jpg');
    }
  }
}

test();
