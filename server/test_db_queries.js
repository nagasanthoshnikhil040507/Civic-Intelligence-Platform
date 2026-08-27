const mongoose = require('mongoose');
const { config } = require('dotenv');
config({ path: '.env' });

const { Complaint } = require('./src/database/models/Complaint');
const { User } = require('./src/database/models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    try {
      const highPriorityUnresolved = await Complaint.find({
        isDeleted: false,
        status: { $nin: ['resolved', 'closed', 'rejected'] },
        $or: [
          { priority: { $in: ['high', 'critical'] } },
          { 'aiAnalysis.priority': { $gte: 75 } }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('citizenId', 'firstName lastName');
      console.log('Query success! found:', highPriorityUnresolved.length);
    } catch (e) {
      console.log('Query error:', e.message);
    }

    try {
      const users = await User.find({ isDeleted: false })
        .select('-passwordHash -loginHistory')
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(10);
      console.log('Users query success! found:', users.length);
    } catch(e) {
      console.log('Users query error:', e.message);
    }

  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

test();
