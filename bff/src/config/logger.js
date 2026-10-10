const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");

class BffLogger {
  static getInstance() {
    if (!BffLogger.instance) {
      const logDir = path.join(process.cwd(), "logs");

      const dailyRotate = new DailyRotateFile({
        filename: path.join(logDir, "bff-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "14d",
        level: "info",
      });

      BffLogger.instance = winston.createLogger({
        level: process.env.LOG_LEVEL || "info",
        format: winston.format.combine(
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.json()
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message }) => `[BFF ${timestamp}] ${level}: ${message}`)
            ),
          }),
          dailyRotate,
        ],
      });
    }
    return BffLogger.instance;
  }
}

module.exports = BffLogger.getInstance();
