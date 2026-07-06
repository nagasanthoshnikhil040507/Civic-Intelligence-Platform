import { z } from 'zod';

export const userValidationSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8), // Plain password for validation, hashed before save
  role: z.enum(['citizen', 'officer', 'admin']).optional(),
  phone: z.string().optional(),
});

export const departmentValidationSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  jurisdiction: z.string(),
  categoriesHandled: z.array(z.string()),
  contactDetails: z.object({
    email: z.string().email(),
    phone: z.string(),
  }),
});

export const complaintValidationSchema = z.object({
  category: z.string(),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180), // Longitude
      z.number().min(-90).max(90),   // Latitude
    ]),
  }),
  images: z.array(z.string().url()).optional(),
});
