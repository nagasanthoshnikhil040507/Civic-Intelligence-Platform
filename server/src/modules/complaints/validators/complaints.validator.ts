import { z } from 'zod';

export const aiAnalysisSchema = z.object({
  garbageDetected: z.boolean().nullish(),
  confidence: z.number().nullish(),
  severity: z.string().nullish(),
  priority: z.number().nullish(),
  quantityEstimation: z.string().nullish(),
  duplicateDetected: z.boolean().nullish(),
  matchedComplaintId: z.string().nullish(),
  processingStatus: z.string().nullish(),
  analyzedAt: z.string().datetime().nullish(),
  message: z.string().nullish(),
  summary: z.string().nullish(),
  similarity: z.number().nullish(),
  categoryPrediction: z.string().nullish(),
  duplicateLevel: z.enum(["HIGH", "POSSIBLE", "NONE"]).nullish(),
  locationScore: z.number().nullish(),
  textScore: z.number().nullish(),
  imageScore: z.number().nullish()
});

export const createComplaintSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  category: z.string().optional().default('Garbage'),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
  address: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  aiAnalysis: aiAnalysisSchema.optional(),
});

export const updateComplaintSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  category: z.string().optional(),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }).optional(),
  address: z.string().optional(),
});

export const queryComplaintSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  severity: z.string().optional(),
  departmentId: z.string().optional(),
  keyword: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const nearbyQuerySchema = z.object({
  lat: z.string().transform(Number).refine(n => n >= -90 && n <= 90, 'Invalid latitude'),
  lng: z.string().transform(Number).refine(n => n >= -180 && n <= 180, 'Invalid longitude'),
  radius: z.string().transform(Number).optional().default('5000'),
  status: z.string().optional(),
  category: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

export const searchAreaQuerySchema = z.object({
  minLng: z.string().transform(Number).refine(n => n >= -180 && n <= 180, 'Invalid longitude'),
  minLat: z.string().transform(Number).refine(n => n >= -90 && n <= 90, 'Invalid latitude'),
  maxLng: z.string().transform(Number).refine(n => n >= -180 && n <= 180, 'Invalid longitude'),
  maxLat: z.string().transform(Number).refine(n => n >= -90 && n <= 90, 'Invalid latitude'),
  status: z.string().optional(),
  category: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});

export const assignComplaintSchema = z.object({
  officerId: z.string().length(24, 'Invalid officer ID').optional(),
  departmentId: z.string().length(24, 'Invalid department ID').optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected']),
  note: z.string().optional(),
});

export const resolveComplaintSchema = z.object({
  resolutionNote: z.string().min(10, 'Resolution note must be at least 10 characters').max(2000),
  workPerformed: z.string().optional(),
});
