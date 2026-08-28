const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const c = await mongoose.connection.collection('complaints').findOne({ 'location.coordinates.0': { $ne: 0 } });
  console.log(JSON.stringify(c, null, 2));
  process.exit(0);
});
