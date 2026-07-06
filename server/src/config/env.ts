import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(10),
  CLOUDINARY_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().url(),
  EMAIL_SERVICE_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const config = {
  env: _env.data.NODE_ENV,
  port: parseInt(_env.data.PORT, 10),
  mongoUri: _env.data.MONGODB_URI,
  jwtSecret: _env.data.JWT_SECRET,
  cloudinaryUrl: _env.data.CLOUDINARY_URL,
  aiServiceUrl: _env.data.AI_SERVICE_URL,
  emailApiKey: _env.data.EMAIL_SERVICE_API_KEY,
  frontendUrl: _env.data.FRONTEND_URL,
};
