const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, {strict:false, collection:'users'}));
    const admin = await User.findOne({role: 'admin'});
    
    // Generate valid token directly
    const token = jwt.sign(
      { userId: admin._id, role: admin.role, sessionId: 'test-session' },
      process.env.JWT_SECRET,
      { issuer: 'civic-intelligence-platform', expiresIn: '15m' }
    );
    
    console.log('Token created:', !!token);
    
    const endpoints = [
      '/admin/stats', 
      '/admin/ai-insights', 
      '/admin/complaints', 
      '/admin/users',
      '/admin/users?role=citizen',
      '/admin/users?role=officer'
    ];
    
    for (const ep of endpoints) {
      try {
        const res = await axios.get('http://localhost:5000/api/v1' + ep, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log(`\n--- ${ep} ---`);
        console.log('Status:', res.status);
        console.log('Success:', res.data.success);
        if (res.data.data) {
          if (res.data.data.users) console.log('Users fetched:', res.data.data.users.length);
          else if (res.data.data.complaints) console.log('Complaints fetched:', res.data.data.complaints.length);
          else console.log('Data keys:', Object.keys(res.data.data));
        }
      } catch (err) {
        console.log(`\n--- ${ep} --- (ERROR)`);
        console.log('Status:', err.response?.status);
        console.log('Error Data:', err.response?.data || err.message);
      }
    }
    
    // Fetch a single complaint specifically requested by user
    const specificComplaintId = '6a8f053dae70a77c7efb3b62';
    try {
      const specCompDetails = await axios.get(`http://localhost:5000/api/v1/admin/complaints/${specificComplaintId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log(`\n--- /admin/complaints/${specificComplaintId} ---`);
      console.log('Status:', specCompDetails.status);
      console.log('Success:', specCompDetails.data.success);
      console.log('Has complaint:', !!specCompDetails.data.data);
      if (specCompDetails.data.data) {
        console.log('Complaint Title:', specCompDetails.data.data.title);
        console.log('AI Analysis present:', !!specCompDetails.data.data.aiAnalysis);
      }
    } catch (err) {
      console.log(`\n--- /admin/complaints/${specificComplaintId} --- (ERROR)`);
      console.log('Status:', err.response?.status);
      console.log('Error:', err.response?.data?.message || err.message);
    }

    // Fetch another complaint from the list
    const compRes = await axios.get('http://localhost:5000/api/v1/admin/complaints', { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    if (compRes.data.data.complaints.length > 0) {
      // Find a complaint that is NOT the specific one
      const otherComplaint = compRes.data.data.complaints.find(c => c._id !== specificComplaintId);
      if (otherComplaint) {
        const id = otherComplaint._id;
        const details = await axios.get(`http://localhost:5000/api/v1/admin/complaints/${id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log(`\n--- /admin/complaints/${id} (Another Complaint) ---`);
        console.log('Status:', details.status);
        console.log('Success:', details.data.success);
        console.log('Has complaint:', !!details.data.data);
      }
    }

    // Fetch a single user
    const userRes = await axios.get('http://localhost:5000/api/v1/admin/users', { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    if (userRes.data.data.users.length > 0) {
      const id = userRes.data.data.users[0]._id;
      const details = await axios.get(`http://localhost:5000/api/v1/admin/users/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log(`\n--- /admin/users/${id} ---`);
      console.log('Status:', details.status);
      console.log('Success:', details.data.success);
      console.log('Has user:', !!details.data.data.user);
    }

  } catch(err) {
    console.error('Test failed:', err.response?.data || err.message);
  } finally {
    mongoose.disconnect();
  }
};

test();
