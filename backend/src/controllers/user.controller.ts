import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { updateProfileSchema } from "../validators";
import { User } from "../models";

export class UserController {
  public static async getMe(req: Request, res: Response) {
    try {
      const refreshToken = (req as any).cookies?.refresh_token;
      const authHeader = req.headers.authorization;
      let userId: number | undefined;

      if (refreshToken) {
        try {
          const decoded = AuthService.verifyRefreshToken(refreshToken);
          userId = decoded.id;
        } catch {
          // Fallback to Bearer token if refresh token validation fails
        }
      }

      if (!userId && authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const token = authHeader.substring(7).trim();
          const decoded = AuthService.verifyAccessToken(token);
          userId = decoded.id;
        } catch {
          // Access token also failed
        }
      }

      if (!userId) {
        return res.status(401).json({ status: "error", message: "Session expired or not authenticated." });
      }

      const user = await User.findByPk(userId, {
        attributes: ["id", "name", "email", "phone_no", "employment_type", "profile_photo_url"],
      });

      if (!user) {
        return res.status(401).json({ status: "error", message: "User not found." });
      }

      const accessToken = AuthService.generateAccessToken(user);

      return res.status(200).json({
        status: "success",
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone_no: user.phone_no,
            employment_type: user.employment_type,
            profile_photo_url: user.profile_photo_url,
          },
          accessToken,
        },
      });
    } catch (err) {
      return res.status(401).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const profile = await UserService.getProfile(userId);
      return res.status(200).json({ status: "success", data: profile });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const profilePhotoUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const updatedProfile = await UserService.updateProfile(userId, value, profilePhotoUrl);
      return res.status(200).json({ status: "success", message: "Profile updated successfully", data: updatedProfile });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }
}
