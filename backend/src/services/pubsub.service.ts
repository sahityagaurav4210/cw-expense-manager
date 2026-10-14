import dayjs from "dayjs";
import { redisPublisher } from "../config/redis.config";
import { logger } from "../config/logger.config";

export interface LoginAlertParams {
  email: string;
  username: string;
  ipAddress: string;
  link?: string;
  supportUrl?: string;
  subject?: string;
}

export interface FailedLoginAlertParams {
  email: string;
  username: string;
  ipAddress: string;
  link?: string;
  supportUrl?: string;
  subject?: string;
}

export interface OtpEmailParams {
  email: string;
  name: string;
  otp: string;
  supportEmail?: string;
  subject?: string;
}

export class PubSubService {
  private static readonly CHANNELS = {
    LOGIN_UPDATES: "login_updates",
    FAILED_LOGIN_UPDATES: "failed_login_updates",
    OTP_ALERTS: "otp-alerts",
  };

  /**
   * Helper to check if email publishing should proceed based on APP_ENV
   * Only send notifications if APP_ENV is NOT 'local' (e.g. dev, prod)
   */
  private static shouldSendEmails(): boolean {
    const appEnv = (process.env.APP_ENV || "local").trim().toLowerCase();
    return appEnv !== "local";
  }

  /**
   * Publishes message to a specified Redis channel
   */
  private static async publish(channel: string, payload: any): Promise<void> {
    if (!this.shouldSendEmails()) {
      const appEnv = process.env.APP_ENV || "local";
      logger.info(
        `[PubSub] Email notification skipped for channel '${channel}' because APP_ENV is '${appEnv}'. Payload: ${JSON.stringify(
          payload,
        )}`,
      );
      return;
    }

    try {
      const message = JSON.stringify(payload);
      await redisPublisher.publish(channel, message);
      logger.info(`[PubSub] Message published to channel '${channel}' successfully.`);
    } catch (err) {
      logger.error(`[PubSub] Failed to publish message to channel '${channel}': ${(err as Error).message}`);
    }
  }

  /**
   * Sends successful login alert notification via Redis pub/sub
   */
  public static async publishLoginAlert(params: LoginAlertParams): Promise<void> {
    const payload = {
      content: {
        email: params.email,
        ipAddress: params.ipAddress || "127.0.0.1",
        link: params.link || "http://localhost:9123/login",
        supportUrl: params.supportUrl || "mailto:support@codingworks.in",
        username: params.username,
        subject: params.subject || "New sign-in detected",
      },
      timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };

    await this.publish(this.CHANNELS.LOGIN_UPDATES, payload);
  }

  /**
   * Sends unsuccessful login attempt alert notification via Redis pub/sub
   */
  public static async publishFailedLoginAlert(params: FailedLoginAlertParams): Promise<void> {
    const payload = {
      content: {
        email: params.email,
        ipAddress: params.ipAddress || "127.0.0.1",
        link: params.link || "http://localhost:9123/login",
        supportUrl: params.supportUrl || "mailto:support@codingworks.in",
        username: params.username,
        subject: params.subject || "Security Alert: Unsuccessful login attempt detected",
      },
      timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };

    await this.publish(this.CHANNELS.FAILED_LOGIN_UPDATES, payload);
  }

  /**
   * Sends OTP verification email via Redis pub/sub
   */
  public static async publishOtpEmail(params: OtpEmailParams): Promise<void> {
    const payload = {
      content: {
        email: params.email,
        supportEmail: params.supportEmail || "mailto:support@codingworks.in",
        userName: params.name,
        name: params.name,
        subject: params.subject || "Your Login Verification OTP",
        otp: params.otp,
      },
      timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };

    await this.publish(this.CHANNELS.OTP_ALERTS, payload);
  }
}
