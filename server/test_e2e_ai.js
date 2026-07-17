const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  const email = 'test_ai_e2e_' + Date.now() + '@example.com';
  console.log('Registering', email);
  try {
    await axios.post('http://localhost:5000/api/v1/auth/register', {
      firstName: 'Test',
      lastName: 'User',
      email: email,
      password: 'Password123!',
      role: 'citizen'
    });
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: email,
      password: 'Password123!'
    });
    const token = loginRes.data.data.token;
    console.log('Login success!');

    const complaintRes = await axios.post('http://localhost:5000/api/v1/complaints', {
      title: 'E2E AI Test Pothole',
      description: 'Huge pothole on the main road',
      category: 'infrastructure',
      location: { type: 'Point', coordinates: [78.4867, 17.3850] }
    }, { headers: { Authorization: 'Bearer ' + token } });
    
    const complaintId = complaintRes.data.data._id;
    console.log('Complaint created:', complaintId);

    fs.writeFileSync('dummy.jpg', Buffer.from('fake image data'));
    const form = new FormData();
    form.append('images', fs.createReadStream('dummy.jpg'));
    
    await axios.post('http://localhost:5000/api/v1/complaints/' + complaintId + '/images', form, {
      headers: { ...form.getHeaders(), Authorization: 'Bearer ' + token }
    });
    
    console.log('Waiting 5s for AI...');
    await new Promise(r => setTimeout(r, 5000));
    
    const verifyRes = await axios.get('http://localhost:5000/api/v1/complaints/' + complaintId, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log(JSON.stringify(verifyRes.data.data.aiAnalysis, null, 2));
    
    if (verifyRes.data.data.aiAnalysis && verifyRes.data.data.aiAnalysis.processingStatus === 'completed') {
      console.log('PASS: AI analysis completed successfully and populated MongoDB.');
    } else {
      console.log('FAIL: AI analysis is not completed.');
    }
  } catch (e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
test();
