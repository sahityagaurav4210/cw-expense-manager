require('dotenv/config');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const ProxyController = require('./controllers/proxy.controller');
const { allowedOrigins } = require('./config/cors');
const { limiter } = require('./config/rateLimiter');
const fs = require('node:fs');

const app = express();

const PORT = process.env.PORT || 4000;
const SERVER_HOST = process.env.SERVER_HOST || 'localhost';
const EXT_SERVER_HOST = process.env.EXT_SERVER_HOST || `http://${SERVER_HOST}:${PORT}`;
const APP_VERSION = process.env.APP_VERSION || '0.0.0';

async function bootstrap() {
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(limiter);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'cw-expense-tracker-bff',
      timestamp: new Date(),
      version: APP_VERSION,
    });
  });

  // Proxy all API requests to API Gateway / Backend
  app.use('/api/v1', ProxyController.forwardRequest);
  app.use('/uploads', ProxyController.forwardRequest);

  const bannerContent = fs.readFileSync('./assets/banner.txt', 'utf8');

  app.listen(PORT, SERVER_HOST);

  logger.info(bannerContent);
  logger.info(`BFF server is running on ${EXT_SERVER_HOST} 🚀🚀🚀🚀`);
}

bootstrap().catch((error) => logger.error(`Error starting BFF server: ${error.message}`));
