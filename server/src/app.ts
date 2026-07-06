import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { config } from './config/env';
import { successHandler, errorHandler as morganErrorHandler } from './middlewares/morgan';
import { apiLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import routesV1 from './routes/v1';

const app = express();

// Trust reverse proxy for accurate IP tracking in rate limiters
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Gzip compression
app.use(compression());

// Enable CORS
app.use(cors({ origin: true, credentials: true }));

// HTTP Request Logging
if (config.env !== 'test') {
  app.use(successHandler);
  app.use(morganErrorHandler);
}

// Limit requests
if (config.env === 'production') {
  app.use('/api', apiLimiter);
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Swagger Docs
const swaggerDocument = YAML.load(path.resolve(process.cwd(), 'docs/swagger.yml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// V1 API Routes
app.use('/api/v1', routesV1);

// Mount routes
import authRoutes from './modules/auth/routes/auth.routes';
import complaintRoutes from './modules/complaints/routes/complaint.routes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);

// Handle 404
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
