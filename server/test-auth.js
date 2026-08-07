const axios = require('axios');

async function testAuth() {
  const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  });

  try {
    // 1. Register
    console.log('Registering user...');
    let res = await api.post('/auth/register', {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@civic.com',
      password: 'Password123!',
      phone: '1234567890'
    });
    console.log('Register success:', res.data);
    const cookies = res.headers['set-cookie'];
    console.log('Set-Cookie after register:', cookies);

    // 2. Login
    console.log('\nLogging in...');
    res = await api.post('/auth/login', {
      email: 'admin@civic.com',
      password: 'Password123!'
    });
    console.log('Login success:', res.data);
    const loginCookies = res.headers['set-cookie'];
    console.log('Set-Cookie after login:', loginCookies);

    // 3. Refresh
    console.log('\nRefreshing token...');
    const cookieHeader = loginCookies.map(c => c.split(';')[0]).join('; ');
    res = await api.post('/auth/refresh', {}, {
      headers: { Cookie: cookieHeader }
    });
    console.log('Refresh success:', res.data);
    
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testAuth();
