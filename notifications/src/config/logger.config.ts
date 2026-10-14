import winston from "winston";
import { AppLoggerColors, AppLoggerLevels } from "../constants.js";
import { FileHelper } from "../helpers/index.js";

export class LoggerManager {
  private static instance: winston.Logger;

  private constructor() {}

  public static initialize(): void {
    if (!LoggerManager.instance) {
      const format = winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}] : ${info.message}`,
        ),
      );

      const consoleFormat = winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}] : ${info.message}`,
        ),
      );

      const transports = [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({
          filename: FileHelper.getAbsolutePath("./logs/error.log"),
          level: "error",
        }),
        new winston.transports.File({
          filename: FileHelper.getAbsolutePath("./logs/info.log"),
          level: "info",
        }),
        new winston.transports.File({
          filename: FileHelper.getAbsolutePath("./logs/debug.log"),
          level: "debug",
        }),
        new winston.transports.File({
          filename: FileHelper.getAbsolutePath("./logs/warn.log"),
          level: "warn",
        }),
        new winston.transports.File({
          filename: FileHelper.getAbsolutePath("./logs/http.log"),
          level: "http",
        }),
      ];

      winston.addColors(AppLoggerColors);
      LoggerManager.instance = winston.createLogger({
        level: "debug",
        levels: AppLoggerLevels,
        format,
        transports,
      });
    }
  }

  public static getInstance(): winston.Logger {
    if (!LoggerManager.instance) {
      LoggerManager.initialize();
    }

    return LoggerManager.instance;
  }
}
