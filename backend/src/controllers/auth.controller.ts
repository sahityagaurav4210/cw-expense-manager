import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSendOtpSchema,
  forgotPasswordVerifyOtpSchema,
  forgotPasswordResendOtpSchema,
  forgotPasswordResetSchema,
} from "../validators";

export class AuthController {
  public static async register(req: Request, res: Response) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const profilePhotoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const result = await AuthService.register(value, profilePhotoUrl);

      // Set httpOnly secure refresh token cookie
      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.clearCookie("access_token");

      return res.status(201).json({
        status: "success",
        message: "User registered successfully.",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async login(req: Request, res: Response) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        req.ip ||
        "127.0.0.1";

      const result = await AuthService.login(value, clientIp);

      return res.status(200).json({
        status: "success",
        message: result.message,
        data: {
          requiresOtp: result.requiresOtp,
          twoFactorMethod: result.twoFactorMethod,
          tempToken: result.tempToken,
          email: result.email,
          defaultOtp: result.defaultOtp,
        },
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async verifyOtp(req: Request, res: Response) {
    try {
      const { error, value } = verifyOtpSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        req.ip ||
        "127.0.0.1";

      const result = await AuthService.verifyLoginOtp(value.tempToken, value.otp, clientIp);

      // Set httpOnly secure refresh token cookie
      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.clearCookie("access_token");

      return res.status(200).json({
        status: "success",
        message: "User logged in successfully.",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async resendOtp(req: Request, res: Response) {
    try {
      const { error, value } = resendOtpSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const result = await AuthService.resendLoginOtp(
        value.tempToken,
        value.captchaText || value.captcha,
        value.captchaId,
      );
      return res.status(200).json({
        status: "success",
        message: result.message,
        data: {
          defaultOtp: result.defaultOtp,
        },
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async logout(req: Request, res: Response) {
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    res.clearCookie("access_token");
    return res.status(200).json({ status: "success", message: "Logged out successfully." });
  }

  public static async forgotPasswordSendOtp(req: Request, res: Response) {
    try {
      const { error, value } = forgotPasswordSendOtpSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const result = await AuthService.forgotPasswordSendOtp(
        value.email,
        value.captchaText || value.captcha,
        value.captchaId,
      );
      return res.status(200).json({
        status: "success",
        message: result.message,
        data: {
          resetToken: result.resetToken,
          email: result.email,
        },
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async switchLogin2faMethod(req: Request, res: Response) {
    try {
      const { tempToken } = req.body;
      const result = await AuthService.switchLogin2faMethod(tempToken);
      return res.status(200).json({
        status: "success",
        message: result.message,
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async forgotPasswordVerifyOtp(req: Request, res: Response) {
    try {
      const { error, value } = forgotPasswordVerifyOtpSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const result = await AuthService.forgotPasswordVerifyOtp(value.resetToken, value.otp);
      return res.status(200).json({
        status: "success",
        message: result.message,
        data: {
          resetToken: result.resetToken,
        },
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async forgotPasswordResendOtp(req: Request, res: Response) {
    try {
      const { error, value } = forgotPasswordResendOtpSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const result = await AuthService.forgotPasswordResendOtp(
        value.resetToken,
        value.captchaText || value.captcha,
        value.captchaId,
      );
      return res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async forgotPasswordReset(req: Request, res: Response) {
    try {
      const { error, value } = forgotPasswordResetSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const result = await AuthService.forgotPasswordReset(value.resetToken, value.password);
      return res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }
}
