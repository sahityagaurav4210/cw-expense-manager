import { Redis } from "ioredis";
import { LoggerManager } from "../config/index.js";

export class Publisher {
  private static instance: Redis;
  private static readonly REDIS_URL = process.env.REDIS_URL;

  private constructor() {}

  public static async initialize(): Promise<Redis> {
    const logger = LoggerManager.getInstance();

    if (Publisher.instance) return Publisher.instance;

    if (!Publisher.REDIS_URL) {
      logger.error(
        "Could not connect to Redis: REDIS_URL environment variable is not set, quitting the application.",
      );
      process.exit(1);
    }

    Publisher.instance = new Redis(Publisher.REDIS_URL);

    Publisher.instance.on("connect", () => {
      logger.info("Hurray, publisher is online 🚀🚀🚀🚀.");
    });

    Publisher.instance.on("error", (error: Error) => {
      logger.error("Error occurred with Redis connection:", error);
      process.exit(1);
    });

    return Publisher.instance;
  }

  public static async getInstance(): Promise<Redis> {
    if (!Publisher.instance) {
      await Publisher.initialize();
    }
    return Publisher.instance;
  }
}
