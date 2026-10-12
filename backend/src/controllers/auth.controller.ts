import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { registerSchema, loginSchema } from "../validators";

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

      const result = await AuthService.login(value);

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
}
