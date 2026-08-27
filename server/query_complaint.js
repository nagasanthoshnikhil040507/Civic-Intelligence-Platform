const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, {strict:false, collection:'complaints'}));
  const c = await Complaint.findById('6a8f053dae70a77c7efb3b62');
  console.log('Exists:', !!c);
  if(c) console.log('isDeleted:', c.isDeleted);
  process.exit(0);
});
