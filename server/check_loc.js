const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const c = await mongoose.connection.collection('complaints').find({}).limit(5).toArray();
  console.log(JSON.stringify(c.map(x=>x.location), null, 2));
  process.exit(0);
});
