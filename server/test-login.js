const axios = require('axios');

async function testAllLogins() {
  const users = ['admin@civic.com', 'officer@civic.com', 'citizen@civic.com'];
  
  for (const email of users) {
    try {
      const res = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email,
        password: 'Password123!'
      });
      console.log(`✅ Login successful for ${email}: Role = ${res.data.data.user.role}`);
    } catch (err) {
      console.error(`❌ Login failed for ${email}:`, err.response ? err.response.data : err.message);
    }
  }
}

testAllLogins();
