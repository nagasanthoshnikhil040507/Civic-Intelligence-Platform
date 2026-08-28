const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const c = await mongoose.connection.collection('complaints').find({}).limit(20).toArray();
  console.log(c.map(x=>x.address));
  process.exit(0);
});
