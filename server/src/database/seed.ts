import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Assuming this script runs from project root via ts-node, path might need adjustment
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is missing');
  process.exit(1);
}

// User Schema (copied for standalone execution to avoid circular deps during seeding)
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'officer', 'admin'], default: 'citizen' },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    emailVerified: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  try {
    await mongoose.connect(uri as string);
    console.log('✅ Connected to MongoDB for seeding');

    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const usersToSeed = [
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@civic.com',
        passwordHash,
        role: 'admin',
        status: 'active',
        emailVerified: true
      },
      {
        firstName: 'Garbage',
        lastName: 'Officer',
        email: 'officer@civic.com',
        passwordHash,
        role: 'officer',
        status: 'active',
        emailVerified: true
      },
      {
        firstName: 'Jane',
        lastName: 'Citizen',
        email: 'citizen@civic.com',
        passwordHash,
        role: 'citizen',
        status: 'active',
        emailVerified: true
      }
    ];

    for (const userData of usersToSeed) {
      // Upsert and update all fields to guarantee correct roles
      await User.updateOne(
        { email: userData.email },
        { $set: userData },
        { upsert: true }
      );
      console.log(`Verified account: ${userData.email} (${userData.role})`);
    }

    console.log('🎉 Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
