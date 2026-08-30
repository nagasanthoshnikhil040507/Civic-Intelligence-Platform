const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const m = require('./dist/database/models/User');
  const User = m.default || m.User || m;
  const user = await User.findOne({ firstName: 'Aravind' });
  console.log(user);
  process.exit(0);
});
