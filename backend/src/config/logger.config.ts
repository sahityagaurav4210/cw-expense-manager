import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

/**
 * Singleton Logger class implementing Winston daily log rotation.
 */
export class LoggerConfig {
  private static instance: winston.Logger;

  private constructor() {}

  public static getInstance(): winston.Logger {
    if (!LoggerConfig.instance) {
      const logDir = path.join(process.cwd(), "logs");

      const dailyRotateTransport = new DailyRotateFile({
        filename: path.join(logDir, "backend-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "14d",
        level: "info",
      });

      LoggerConfig.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || "info",
        format: winston.format.combine(
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, stack }) => {
                return `[${timestamp}] ${level}: ${message} ${stack ? "\n" + stack : ""}`;
              })
            ),
          }),
          dailyRotateTransport,
        ],
      });
    }

    return LoggerConfig.instance;
  }
}

export const logger = LoggerConfig.getInstance();
