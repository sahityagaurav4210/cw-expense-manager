import Redis from "ioredis";
import { logger } from "./logger.config";

/**
 * Singleton RedisConfig class managing Redis client connection and key prefixing.
 */
export class RedisConfig {
  private static instance: Redis;
  private static readonly KEY_PREFIX = "cw-expense-tracker:";

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisConfig.instance) {
      const redisHost = process.env.REDIS_HOST || "localhost";
      const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

      RedisConfig.instance = new Redis({
        host: redisHost,
        port: redisPort,
        keyPrefix: RedisConfig.KEY_PREFIX,
        retryStrategy(times) {
          const delay = Math.min(times * 100, 2000);
          return delay;
        },
        lazyConnect: true,
      });

      RedisConfig.instance.on("connect", () => {
        logger.info("Connected to Redis service successfully.");
      });

      RedisConfig.instance.on("error", (err) => {
        logger.warn(`Redis connection warning: ${err.message}`);
      });
    }

    return RedisConfig.instance;
  }
}

export const redisClient = RedisConfig.getInstance();
