const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const m = require('./dist/database/models/User');
  const User = m.default || m.User || m;
  const user = await User.findOne({ firstName: 'Aravind', lastName: 'Sai' });
  if (user) {
    user.requestedDepartment = 'ROADS';
    user.departmentStatus = 'PENDING';
    user.department = 'UNASSIGNED';
    await user.save();
    console.log('User repaired:', user);
  } else {
    console.log('User not found');
  }
  process.exit(0);
});
