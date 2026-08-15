import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkJohn = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const db = mongoose.connection.db;
    const user = await db?.collection('users').findOne({ email: 'john123@gmail.com' });
    console.log(user);
    if (user && user.passwordHash) {
      console.log('passwordHash length:', user.passwordHash.length);
      // test against 'password123'
      const isMatch = await bcrypt.compare('password123', user.passwordHash);
      console.log('Matches password123:', isMatch);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkJohn();
