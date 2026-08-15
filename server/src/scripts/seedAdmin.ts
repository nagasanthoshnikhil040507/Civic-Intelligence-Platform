import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../database/models/User';
import { Role } from '../modules/auth/constants/roles';
import { logger } from '../utils/logger';

// Load environment variables manually for script context
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables.');
    }

    // Determine the exact database from the URI for logging
    logger.info(`Connecting to MongoDB...`);
    
    await mongoose.connect(mongoUri);
    const dbName = mongoose.connection.db?.databaseName;
    logger.info(`Successfully connected to database. Current DB: ${dbName}`);

    // Verify it is civic_intelligence
    if (dbName !== 'civic_intelligence') {
      logger.warn(`WARNING: Connected to database '${dbName}' instead of 'civic_intelligence'.`);
    }

    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@civic.com';
    const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      logger.info(`Admin account with email ${adminEmail} already exists.`);
      process.exit(0);
    }

    logger.info(`Creating admin account for ${adminEmail}...`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Create the admin user
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: adminEmail,
      passwordHash: passwordHash,
      role: Role.ADMIN,
      isVerified: true
    });

    logger.info(`Successfully created admin account: ${admin.email}`);
    logger.info('You can now log in at /admin/login');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding admin account:', error);
    process.exit(1);
  }
};

seedAdmin();
