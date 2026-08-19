import app from './app';
import { config } from './config/env';
import { connectDB } from './database/connection';
import { logger } from './utils/logger';

let server: any;

const startServer = async () => {
  await connectDB();

  server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    
    // Safe startup logs as requested
    const dbUri = config.mongoUri;
    const isAtlas = dbUri.includes('mongodb.net');
    const dbHost = isAtlas ? dbUri.split('@')[1]?.split('/')[0] : dbUri.split('://')[1]?.split('/')[0];
    const dbName = dbUri.split('/').pop()?.split('?')[0];

    console.log('\n========================================');
    console.log('[DATABASE CONNECTED]');
    console.log(`Host: ${dbHost || 'Unknown'}`);
    console.log(`Database: ${dbName || 'Unknown'}`);
    console.log(`Environment: ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    console.log('========================================\n');
  });
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
