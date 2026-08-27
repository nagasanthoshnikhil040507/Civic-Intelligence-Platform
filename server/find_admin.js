const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, {strict:false, collection:'users'}));
  const admin = await User.findOne({role: 'admin'});
  console.log('Admin:', admin.email);
  process.exit(0);
});
