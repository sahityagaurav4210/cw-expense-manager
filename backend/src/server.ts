import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { logger } from "./config/logger.config";
import { sequelize } from "./config/database.config";
import { rateLimiter } from "./middlewares/rateLimiter.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import routes from "./routes";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8080",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.set("trust proxy", true);

// Static uploads folder for profile photos
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use((req, res, next) => {
  fs.appendFileSync(
    path.join(process.cwd(), "requests.log"),
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} (url: ${req.url}) from ${req.ip}\n`,
  );
  next();
});
app.use("/api/v1", routes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "cw-expense-tracker-backend",
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Database sync & server listen
async function bootstrap() {
  try {
    const SERVER_HOST = process.env.SERVER_HOST || "localhost";
    // Ensure master schema exists in PostgreSQL
    await sequelize.query("CREATE SCHEMA IF NOT EXISTS master;");
    await sequelize.query("CREATE SCHEMA IF NOT EXISTS public;");

    await sequelize.sync({ alter: false });
    logger.info("Database schemas synced successfully.");

    app.listen(PORT, SERVER_HOST, () => {
      logger.info(`Backend TypeScript service running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Server initialization failed: ${(err as Error).message}`, {
      stack: (err as Error).stack,
    });
  }
}

bootstrap();
