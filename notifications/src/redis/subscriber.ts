import { Redis } from "ioredis";
import { RedisConstants } from "../constants.js";
import { LoggerManager } from "../config/index.js";
import {
  handleFailedLoginUpdates,
  handleLoginUpdates,
  handleOTP,
  handleProfileUpdate,
  handleSkillAddition,
  handleSkillUpdate,
  handleWelcomeEmail,
} from "./handlers.js";

export class Subscriber {
  private static instance: Redis;
  private static readonly REDIS_URL = process.env.REDIS_URL;

  private constructor() {}

  private static async subscribe(): Promise<void> {
    const logger = LoggerManager.getInstance();

    await this.instance.subscribe(RedisConstants.LOGIN_NOTIFICATION_CHANNEL_NAME);
    await this.instance.subscribe(RedisConstants.FAILED_LOGIN_NOTIFICATION_CHANNEL_NAME);
    await this.instance.subscribe(RedisConstants.WELCOME_EMAIL_CHANNEL_NAME);
    await this.instance.subscribe(RedisConstants.OTP_EMAIL_CHANNEL_NAME);
    logger.info("Subscribed to all channels successfully.");
  }

  public static async initialize(): Promise<Redis> {
    const logger = LoggerManager.getInstance();

    if (Subscriber.instance) return Subscriber.instance;

    if (!Subscriber.REDIS_URL) {
      logger.error(
        "Could not connect to Redis: REDIS_URL environment variable is not set, quitting the application.",
      );
      process.exit(1);
    }

    Subscriber.instance = new Redis(Subscriber.REDIS_URL);

    Subscriber.instance.on("connect", () => {
      logger.info("Hurray, subscriber is online 🚀🚀🚀🚀.");
    });

    Subscriber.instance.on("error", (error: Error) => {
      logger.error("Error occurred with Redis connection:", error);
      process.exit(1);
    });

    Subscriber.instance.on(
      "message",
      async (channel: string, message: string) => {
        switch (channel) {
          case RedisConstants.LOGIN_NOTIFICATION_CHANNEL_NAME:
            await handleLoginUpdates(message);
            break;

          case RedisConstants.FAILED_LOGIN_NOTIFICATION_CHANNEL_NAME:
            await handleFailedLoginUpdates(message);
            break;

          case RedisConstants.PROFILE_UPDATE_CHANNEL_NAME:
            await handleProfileUpdate(message);
            break;

          case RedisConstants.SKILL_ADDITION_CHANNEL_NAME:
            await handleSkillAddition(message);
            break;

          case RedisConstants.SKILL_UPDATE_CHANNEL_NAME:
            await handleSkillUpdate(message);
            break;

          case RedisConstants.WELCOME_EMAIL_CHANNEL_NAME:
            await handleWelcomeEmail(message);
            break;

          case RedisConstants.OTP_EMAIL_CHANNEL_NAME:
            await handleOTP(message);
            break;

          default:
            logger.warn(`Received message from unknown channel: ${channel}`);
        }
      },
    );

    await this.subscribe();
    return Subscriber.instance;
  }

  public static async getInstance(): Promise<Redis> {
    if (!Subscriber.instance) {
      await Subscriber.initialize();
    }
    return Subscriber.instance;
  }
}
