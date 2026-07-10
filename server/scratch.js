const mongoose = require('mongoose');
const { Complaint } = require('./src/database/models/Complaint');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const complaint = await Complaint.findOne().sort({ createdAt: -1 }).lean();
  console.log(JSON.stringify(complaint, null, 2));
  process.exit(0);
}

run();
