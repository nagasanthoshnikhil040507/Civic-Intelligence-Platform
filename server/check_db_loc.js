const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const c = await mongoose.connection.collection('complaints').find({}).limit(50).toArray();
  const addressStats = c.filter(x => x.address).map(x => x.address);
  console.log("Total complaints checked:", c.length);
  console.log("Complaints with address:", addressStats.length);
  console.log("Addresses:", addressStats);
  
  const coords = c.map(x => x.location?.coordinates);
  console.log("Coords:", coords.slice(0, 5));
  process.exit(0);
});
