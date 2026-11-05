import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { logger } from './config/logger.config';
import { sequelize } from './config/database.config';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { cookieParser } from './middlewares/cookieParser.middleware';
import routes from './routes';
import fs from 'fs';
import dotenv from 'dotenv';
import CORSConfig from './config/cors.config';
import HelmetConfig from './config/helmet.config';
import { globalRequestLoggerMiddleware } from './middlewares/global.middleware';
import FileUtility from './utils/file';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Ensure uploads/bills directory exists
const billsUploadDir = path.join(process.cwd(), 'uploads', 'bills');
if (!fs.existsSync(billsUploadDir)) {
  fs.mkdirSync(billsUploadDir, { recursive: true });
}

// Security & Middlewares
app.use(helmet(HelmetConfig.getHelmetConfig()));
app.use(cors(CORSConfig.getCORS()));
app.use(cookieParser);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);

// Static uploads folder for profile photos with fallback support
app.use('/uploads', (req, res, next) => {
  const cleanPath = req.path.replace(/^\//, '');
  const uploadsDir = path.resolve(__dirname, '../uploads');
  const filePath = path.join(uploadsDir, cleanPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  const cwdFilePath = path.join(process.cwd(), 'uploads', cleanPath);
  if (fs.existsSync(cwdFilePath) && fs.statSync(cwdFilePath).isFile()) {
    return res.sendFile(cwdFilePath);
  }
  if (cleanPath.startsWith('profile-') || cleanPath.includes('profile')) {
    const candidates = [
      path.resolve(__dirname, '../../frontend/public/cw.jpeg'),
      path.resolve(__dirname, '../../../frontend/public/cw.jpeg'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'cw.jpeg'),
      path.join(process.cwd(), 'frontend', 'public', 'cw.jpeg'),
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      return res.sendFile(found);
    }
  }
  return res.status(404).send('File not found');
});

// API Routes
app.use(globalRequestLoggerMiddleware);
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'cw-expense-tracker-backend',
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Database sync & server listen
async function bootstrap() {
  try {
    const SERVER_HOST = process.env.SERVER_HOST || 'localhost';

    // Ensure uploads directory exists and default profile photo is available
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const candidates = [
      path.resolve(__dirname, '../../frontend/public/cw.jpeg'),
      path.resolve(__dirname, '../../../frontend/public/cw.jpeg'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'cw.jpeg'),
      path.join(process.cwd(), 'frontend', 'public', 'cw.jpeg'),
    ];
    const defaultPhotoSrc = candidates.find((p) => fs.existsSync(p));
    const userPhotoDest = path.join(uploadsDir, 'profile-1791540767023-902626212.jpg');
    if (defaultPhotoSrc && !fs.existsSync(userPhotoDest)) {
      try {
        fs.copyFileSync(defaultPhotoSrc, userPhotoDest);
      } catch {}
    }

    await sequelize.query(FileUtility.readFile('src/db/migrations/createMasterSchema.sql'));
    await sequelize.query(FileUtility.readFile('src/db/migrations/createPublicSchema.sql'));
    await sequelize.query(FileUtility.readFile('src/db/migrations/alterUsersTableQuery.sql')).catch(() => {});
    await sequelize.query(FileUtility.readFile('src/db/migrations/alterExpenseTableQuery.sql')).catch(() => {});
    await sequelize.query(FileUtility.readFile('src/db/migrations/createBudgetInflowsTableQuery.sql')).catch(() => {});
    await sequelize.query(FileUtility.readFile('src/db/migrations/createDebtsTableQuery.sql')).catch(() => {});
    await sequelize.query(FileUtility.readFile('src/db/migrations/createDebtsSettlementsTableQuery.sql')).catch(() => {});
    await sequelize.query(FileUtility.readFile('src/db/migrations/createContactsTableQuery.sql')).catch(() => {});
    await sequelize.sync({ alter: false });

    app.listen(PORT, SERVER_HOST);
    console.clear();
    console.log(FileUtility.readFile('src/assets/banner.txt'));
    console.log('\n');

    logger.info(`ExM Backend Service started successfully on port ${PORT}`);
    logger.info('Database schemas synced successfully.');
  } catch (err) {
    logger.error(`Server initialization failed: ${(err as Error).message}`, {
      stack: (err as Error).stack,
    });
  }
}

bootstrap();
