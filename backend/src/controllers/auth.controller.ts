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

      res.cookie("access_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400000,
      });

      return res.status(201).json({
        status: "success",
        message: "User registered successfully.",
        data: result,
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

      res.cookie("access_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400000,
      });

      return res.status(200).json({
        status: "success",
        message: "User logged in successfully.",
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async logout(req: Request, res: Response) {
    res.clearCookie("access_token");
    return res.status(200).json({ status: "success", message: "Logged out successfully." });
  }
}
