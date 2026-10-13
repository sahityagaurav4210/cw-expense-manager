import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { logger } from "./config/logger.config";
import { sequelize } from "./config/database.config";
import { rateLimiter } from "./middlewares/rateLimiter.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { cookieParser } from "./middlewares/cookieParser.middleware";
import routes from "./routes";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// Ensure uploads/bills directory exists
const billsUploadDir = path.join(process.cwd(), "uploads", "bills");
if (!fs.existsSync(billsUploadDir)) {
  fs.mkdirSync(billsUploadDir, { recursive: true });
}

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(
  cors({
    origin: [
      "http://localhost:9123",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:4000",
      "http://localhost:8080",
    ],
    credentials: true,
  }),
);
app.use(cookieParser);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.set("trust proxy", true);

// Static uploads folder for profile photos with fallback support
app.use("/uploads", (req, res, next) => {
  const cleanPath = req.path.replace(/^\//, "");
  const uploadsDir = path.resolve(__dirname, "../uploads");
  const filePath = path.join(uploadsDir, cleanPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  const cwdFilePath = path.join(process.cwd(), "uploads", cleanPath);
  if (fs.existsSync(cwdFilePath) && fs.statSync(cwdFilePath).isFile()) {
    return res.sendFile(cwdFilePath);
  }
  if (cleanPath.startsWith("profile-") || cleanPath.includes("profile")) {
    const candidates = [
      path.resolve(__dirname, "../../frontend/public/cw.jpeg"),
      path.resolve(__dirname, "../../../frontend/public/cw.jpeg"),
      path.join(process.cwd(), "..", "frontend", "public", "cw.jpeg"),
      path.join(process.cwd(), "frontend", "public", "cw.jpeg"),
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      return res.sendFile(found);
    }
  }
  return res.status(404).send("File not found");
});

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

    // Ensure uploads directory exists and default profile photo is available
    const uploadsDir = path.resolve(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const candidates = [
      path.resolve(__dirname, "../../frontend/public/cw.jpeg"),
      path.resolve(__dirname, "../../../frontend/public/cw.jpeg"),
      path.join(process.cwd(), "..", "frontend", "public", "cw.jpeg"),
      path.join(process.cwd(), "frontend", "public", "cw.jpeg"),
    ];
    const defaultPhotoSrc = candidates.find((p) => fs.existsSync(p));
    const userPhotoDest = path.join(uploadsDir, "profile-1791540767023-902626212.jpg");
    if (defaultPhotoSrc && !fs.existsSync(userPhotoDest)) {
      try {
        fs.copyFileSync(defaultPhotoSrc, userPhotoDest);
      } catch {}
    }

    // Ensure master schema exists in PostgreSQL
    await sequelize.query("CREATE SCHEMA IF NOT EXISTS master;");
    await sequelize.query("CREATE SCHEMA IF NOT EXISTS public;");

    // Ensure expense columns exist
    await sequelize.query(`ALTER TABLE IF EXISTS "public"."expenses" ALTER COLUMN "name" TYPE VARCHAR(100);`).catch(() => {});
    await sequelize.query(`ALTER TABLE IF EXISTS "public"."expenses" ADD COLUMN IF NOT EXISTS "bill_url" VARCHAR(255);`).catch(() => {});
    await sequelize.query(`ALTER TABLE IF EXISTS "public"."expenses" ADD COLUMN IF NOT EXISTS "bill_original_name" VARCHAR(255);`).catch(() => {});
    await sequelize.query(`ALTER TABLE IF EXISTS "public"."expenses" ADD COLUMN IF NOT EXISTS "bill_mime_type" VARCHAR(100);`).catch(() => {});

    // Ensure budget_inflows table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "public"."budget_inflows" (
        "id" SERIAL PRIMARY KEY,
        "budget_id" INTEGER NOT NULL REFERENCES "public"."budgets"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id"),
        "amount" NUMERIC(12, 2) NOT NULL,
        "source" VARCHAR(100) NOT NULL,
        "received_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "notes" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // Ensure debts and debt_settlements tables exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "public"."debts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id"),
        "type" VARCHAR(20) NOT NULL DEFAULT 'LENT',
        "person_name" VARCHAR(100) NOT NULL,
        "contact_info" VARCHAR(100),
        "initial_amount" NUMERIC(12, 2) NOT NULL,
        "settled_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0,
        "lent_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "due_date" DATE,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "notes" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "public"."debt_settlements" (
        "id" SERIAL PRIMARY KEY,
        "debt_id" INTEGER NOT NULL REFERENCES "public"."debts"("id") ON DELETE CASCADE,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id"),
        "amount" NUMERIC(12, 2) NOT NULL,
        "settlement_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "payment_mode" VARCHAR(50) NOT NULL DEFAULT 'UPI',
        "notes" VARCHAR(255),
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "public"."contacts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(30) NOT NULL,
        "email" VARCHAR(150),
        "profile_photo" VARCHAR(255),
        "company" VARCHAR(100),
        "job_title" VARCHAR(100),
        "category" VARCHAR(50) NOT NULL DEFAULT 'Other',
        "address" VARCHAR(255),
        "notes" VARCHAR(255),
        "is_favorite" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

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
