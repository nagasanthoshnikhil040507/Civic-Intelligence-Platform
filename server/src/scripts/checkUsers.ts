import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const db = mongoose.connection.db;
    const users = await db?.collection('users').find({}).toArray();
    console.log('Users:');
    users?.forEach(u => {
      console.log(`- ${u.email} (${u.role}) : hash=${u.passwordHash ? 'yes' : 'no'}, pwd=${u.password ? 'yes' : 'no'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
checkUsers();
