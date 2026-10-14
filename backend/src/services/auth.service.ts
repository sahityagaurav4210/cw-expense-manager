import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";
import { redisClient } from "../config/redis.config";
import { logger } from "../config/logger.config";
import { PubSubService } from "./pubsub.service";

const JWT_SECRET =
  process.env.JWT_SECRET || "cw_expense_tracker_jwt_secret_key_2026";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "cw_expense_tracker_jwt_refresh_secret_key_2026";

export class AuthService {
  public static generateAccessToken(user: { id: number; email: string; name: string; employment_type?: string }) {
    return jwt.sign(
      { id: user.id, email: user.email, name: user.name, employment_type: user.employment_type },
      JWT_SECRET,
      { expiresIn: "15m" },
    );
  }

  public static generateRefreshToken(user: { id: number; email: string }) {
    return jwt.sign(
      { id: user.id, email: user.email, type: "refresh" },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );
  }

  public static verifyRefreshToken(token: string): { id: number; email: string } {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: number; email: string };
  }

  public static verifyAccessToken(token: string): { id: number; email: string; name: string } {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
  }

  public static async register(userData: any, profilePhotoUrl?: string) {
    const isCaptchaValid = await CaptchaValidationService.validate(
      userData.captcha,
      userData.captchaId || "default",
    );
    if (!isCaptchaValid) {
      throw new Error("Invalid or expired CAPTCHA code.");
    }

    const existingUser = await User.findOne({
      where: { email: userData.email },
    });
    if (existingUser) {
      throw new Error("User with this email already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const user = await User.create({
      name: userData.name,
      email: userData.email,
      phone_no: userData.phone_no || null,
      password: hashedPassword,
      employment_type: userData.employment_type,
      profile_photo_url: profilePhotoUrl,
    });

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    await redisClient
      .set(`refresh:${user.id}:${refreshToken}`, JSON.stringify({ userId: user.id }), "EX", 7 * 86400)
      .catch(() => {});

    logger.info(`User registered successfully: ${user.email}`);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_no: user.phone_no,
        employment_type: user.employment_type,
        profile_photo_url: user.profile_photo_url,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Initiates login: validates credentials, tracks failed attempts,
   * enforces lockout, generates OTP, and dispatches pub/sub notifications.
   */
  public static async login(loginData: any, clientIp: string = "127.0.0.1") {
    const emailKey = loginData.email ? loginData.email.trim().toLowerCase() : "";
    const failedKey = `login:failed:${emailKey}`;
    const maxAttempts = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || "5", 10);
    const lockoutMinutes = parseInt(process.env.LOCKOUT_DURATION_MINUTES || "15", 10);
    const lockoutSeconds = lockoutMinutes * 60;

    // 1. Check account lockout
    if (emailKey) {
      const attemptsStr = await redisClient.get(failedKey);
      const currentAttempts = parseInt(attemptsStr || "0", 10);

      if (currentAttempts >= maxAttempts) {
        const ttl = await redisClient.ttl(failedKey);
        const minutesLeft = Math.max(1, Math.ceil(ttl / 60));
        throw new Error(
          `Your account is temporarily locked due to ${maxAttempts} consecutive failed login attempts. Please try again after ${minutesLeft} minute(s).`,
        );
      }
    }

    // 2. Validate CAPTCHA
    const isCaptchaValid = await CaptchaValidationService.validate(
      loginData.captcha,
      loginData.captchaId || "default",
    );
    if (!isCaptchaValid) {
      throw new Error("Invalid or expired CAPTCHA code.");
    }

    // 3. Find User
    const user = await User.findOne({ where: { email: loginData.email } });
    if (!user) {
      if (emailKey) {
        const attempts = await redisClient.incr(failedKey);
        if (attempts === 1) {
          await redisClient.expire(failedKey, lockoutSeconds);
        }
      }
      throw new Error("Invalid email address or password.");
    }

    // 4. Validate Password
    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password,
    );

    if (!isPasswordValid) {
      const attempts = await redisClient.incr(failedKey);
      if (attempts === 1) {
        await redisClient.expire(failedKey, lockoutSeconds);
      }

      // Publish unsuccessful login alert notification (only sent if APP_ENV !== 'local')
      await PubSubService.publishFailedLoginAlert({
        email: user.email,
        username: user.name,
        ipAddress: clientIp,
        link: "http://localhost:9123/login",
        supportUrl: "mailto:support@codingworks.in",
      });

      const remaining = Math.max(0, maxAttempts - attempts);
      if (remaining <= 0) {
        throw new Error(
          `Account locked. You have reached the maximum allowed failed attempts (${maxAttempts}). Please try again in ${lockoutMinutes} minutes.`,
        );
      }
      throw new Error(`Invalid email address or password. ${remaining} attempt(s) remaining.`);
    }

    // 5. Password is valid -> Generate OTP
    const appEnv = (process.env.APP_ENV || "local").trim().toLowerCase();
    const defaultOtp = process.env.DEFAULT_OTP || "123456";
    const isLocal = appEnv === "local";

    const otp = isLocal
      ? defaultOtp
      : Math.floor(100000 + Math.random() * 900000).toString();

    const tempToken = crypto.randomBytes(24).toString("hex");

    // Store OTP session in Redis with 5-minute TTL
    await redisClient.set(
      `otp:session:${tempToken}`,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        name: user.name,
        otp,
        attempts: 0,
      }),
      "EX",
      300,
    );

    // Publish OTP notification via Redis pub/sub (only sent if APP_ENV !== 'local')
    await PubSubService.publishOtpEmail({
      email: user.email,
      name: user.name,
      otp,
      supportEmail: "mailto:support@codingworks.in",
    });

    logger.info(`OTP generated for user: ${user.email} (APP_ENV: ${appEnv})`);

    return {
      requiresOtp: true,
      tempToken,
      email: user.email,
      defaultOtp: isLocal ? defaultOtp : undefined,
      message: "An OTP has been sent to your registered email address.",
    };
  }

  /**
   * Verifies the OTP provided by the user. If valid, completes login,
   * resets failed attempt counters, dispatches successful login alert, and issues tokens.
   */
  public static async verifyLoginOtp(tempToken: string, otp: string, clientIp: string = "127.0.0.1") {
    if (!tempToken || !otp) {
      throw new Error("Temporary verification token and OTP are required.");
    }

    const sessionKey = `otp:session:${tempToken}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      throw new Error("Verification session has expired or is invalid. Please login again.");
    }

    const session = JSON.parse(sessionData);

    // Check maximum OTP attempt limits
    if ((session.attempts || 0) >= 3) {
      await redisClient.del(sessionKey);
      throw new Error("Too many invalid OTP attempts. Please login again.");
    }

    // Verify OTP value
    if (session.otp !== otp.trim()) {
      session.attempts = (session.attempts || 0) + 1;
      const ttl = await redisClient.ttl(sessionKey);
      if (ttl > 0) {
        await redisClient.set(sessionKey, JSON.stringify(session), "EX", ttl);
      }
      const attemptsLeft = Math.max(0, 3 - session.attempts);
      throw new Error(`Invalid OTP. ${attemptsLeft} attempt(s) remaining.`);
    }

    // OTP is valid -> clear session and reset failed login attempts
    await redisClient.del(sessionKey);
    const emailKey = session.email ? session.email.trim().toLowerCase() : "";
    if (emailKey) {
      await redisClient.del(`login:failed:${emailKey}`);
    }

    const user = await User.findByPk(session.userId);
    if (!user) {
      throw new Error("User record not found.");
    }

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    await redisClient
      .set(`refresh:${user.id}:${refreshToken}`, JSON.stringify({ userId: user.id }), "EX", 7 * 86400)
      .catch(() => {});

    // Publish successful login alert notification via Redis pub/sub (only sent if APP_ENV !== 'local')
    await PubSubService.publishLoginAlert({
      email: user.email,
      username: user.name,
      ipAddress: clientIp,
      link: "http://localhost:9123/login",
      supportUrl: "mailto:support@codingworks.in",
    });

    logger.info(`User logged in successfully via OTP verification: ${user.email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employment_type: user.employment_type,
        phone_no: user.phone_no,
        profile_photo_url: user.profile_photo_url,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Resends OTP for an active temporary login session
   */
  public static async resendLoginOtp(
    tempToken: string,
    captchaText?: string,
    captchaId?: string | number,
  ) {
    if (!tempToken) {
      throw new Error("Temporary token is required to resend OTP.");
    }

    if (captchaText) {
      const isCaptchaValid = await CaptchaValidationService.validate(
        captchaText,
        captchaId || "default",
      );
      if (!isCaptchaValid) {
        throw new Error("Invalid or expired CAPTCHA code.");
      }
    }

    const sessionKey = `otp:session:${tempToken}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      throw new Error("Verification session has expired. Please login again.");
    }

    const session = JSON.parse(sessionData);
    const appEnv = (process.env.APP_ENV || "local").trim().toLowerCase();
    const defaultOtp = process.env.DEFAULT_OTP || "123456";
    const isLocal = appEnv === "local";

    const newOtp = isLocal
      ? defaultOtp
      : Math.floor(100000 + Math.random() * 900000).toString();

    session.otp = newOtp;
    session.attempts = 0;

    await redisClient.set(sessionKey, JSON.stringify(session), "EX", 300);

    await PubSubService.publishOtpEmail({
      email: session.email,
      name: session.name,
      otp: newOtp,
      supportEmail: "mailto:support@codingworks.in",
    });

    return {
      message: "New OTP has been sent to your registered email address.",
      defaultOtp: isLocal ? defaultOtp : undefined,
    };
  }
}
