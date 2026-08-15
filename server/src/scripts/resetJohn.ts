import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resetJohn = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const db = mongoose.connection.db;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Officer@123', salt);
    await db?.collection('users').updateOne({ email: 'john123@gmail.com' }, { $set: { passwordHash } });
    console.log('Password updated to Officer@123');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
resetJohn();
