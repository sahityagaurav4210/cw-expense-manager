import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";
import { redisClient } from "../config/redis.config";
import { logger } from "../config/logger.config";

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

  public static async login(loginData: any) {
    const isCaptchaValid = await CaptchaValidationService.validate(
      loginData.captcha,
      loginData.captchaId || "default",
    );
    if (!isCaptchaValid) {
      throw new Error("Invalid or expired CAPTCHA code.");
    }

    const user = await User.findOne({ where: { email: loginData.email } });
    if (!user) {
      throw new Error("Invalid email address or password.");
    }

    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid email address or password.");
    }

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    await redisClient
      .set(`refresh:${user.id}:${refreshToken}`, JSON.stringify({ userId: user.id }), "EX", 7 * 86400)
      .catch(() => {});

    logger.info(`User logged in successfully: ${user.email}`);
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
}
