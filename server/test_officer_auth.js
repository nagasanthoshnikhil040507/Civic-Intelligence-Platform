const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:5000/api/v1';
const MONGODB_URI = 'mongodb+srv://civic_admin:Nsn0405@cluster0.lb4bxr6.mongodb.net/civic_intelligence?appName=Cluster0';

async function runTests() {
  console.log('--- Officer Auth Integration Tests ---\n');

  console.log('Setup: Seeding temporary officer account...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.useDb(mongoose.connection.db.databaseName);
  const usersCollection = db.collection('users');
  
  const officerEmail = 'temp_officer@civic.com';
  const officerPassword = 'TestOfficer@123';
  const passwordHash = await bcrypt.hash(officerPassword, 10);
  
  await usersCollection.deleteOne({ email: officerEmail });
  await usersCollection.insertOne({
    firstName: 'Test',
    lastName: 'Officer',
    email: officerEmail,
    passwordHash: passwordHash,
    role: 'officer',
    status: 'active',
    isDeleted: false,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0
  });

  // Test 1: Invalid Credentials
  console.log('Test 1: Invalid Credentials');
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: officerEmail,
      password: 'wrongpassword',
      expectedRole: 'officer'
    });
    console.error('FAIL: Expected 401 Unauthorized');
    process.exit(1);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('PASS: Correctly rejected invalid credentials.\n');
    } else {
      console.error(`FAIL: Expected 401, got ${error.response?.status}`);
      process.exit(1);
    }
  }

  // Test 2: Officer can login as Officer
  console.log('Test 2: Officer Login');
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: officerEmail,
      password: officerPassword,
      expectedRole: 'officer'
    });
    if (res.status === 200 && res.data.data.accessToken) {
      console.log('PASS: Officer logged in successfully.\n');
    } else {
      console.error('FAIL: Missing token or bad status');
      process.exit(1);
    }
  } catch (error) {
    console.error(`FAIL: Officer login failed: ${error.response?.data?.message || error.message}`);
    process.exit(1);
  }

  // Test 3: Citizen cannot login as Officer
  console.log('Test 3: Citizen attempting Officer Login');
  try {
    // First, register a temp citizen
    const citizenEmail = `citizen_${Date.now()}@example.com`;
    await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Test',
      lastName: 'Citizen',
      email: citizenEmail,
      password: 'Password@123'
    });

    // Attempt to login as officer
    await axios.post(`${BASE_URL}/auth/login`, {
      email: citizenEmail,
      password: 'Password@123',
      expectedRole: 'officer'
    });
    console.error('FAIL: Expected 403 Forbidden for citizen login as officer');
    process.exit(1);
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log(`PASS: Correctly rejected citizen login: ${error.response.data.message}\n`);
    } else {
      console.error(`FAIL: Expected 403, got ${error.response?.status} - ${error.response?.data?.message}`);
      process.exit(1);
    }
  }

  console.log('Teardown: Deleting temporary officer account...');
  await usersCollection.deleteOne({ email: officerEmail });
  await mongoose.disconnect();

  console.log('\nAll tests passed successfully!');
}

runTests();
