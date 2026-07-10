const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { JwtUtils } = require('./src/modules/auth/utils/jwt.utils');
const { User } = require('./src/database/models/User');

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const officer = await User.findOne({ role: 'officer' });
  const token = JwtUtils.generateAccessToken({ userId: officer._id.toString(), role: 'officer', sessionId: '123' });
  console.log(token);
  process.exit(0);
}

run();
