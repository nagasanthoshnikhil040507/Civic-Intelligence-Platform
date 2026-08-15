import mongoose from 'mongoose';
import { config } from '../config/env';
import { Complaint } from '../database/models/Complaint';

const run = async () => {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to ' + mongoose.connection.name);
  const count = await Complaint.countDocuments();
  console.log('Total complaints:', count);
  const sample = await Complaint.findOne().sort({ createdAt: -1 });
  console.log('Latest complaint:', JSON.stringify(sample, null, 2));
  process.exit(0);
};

run().catch(console.error);
