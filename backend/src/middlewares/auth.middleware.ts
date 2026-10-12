import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../config/logger.config";
import { AuthService } from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name?: string;
    employment_type?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "cw_expense_tracker_jwt_secret_key_2026";

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.query?.token && typeof req.query.token === "string") {
      token = req.query.token;
    } else if (req.query?.accessToken && typeof req.query.accessToken === "string") {
      token = req.query.accessToken;
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        email: string;
        name: string;
        employment_type?: string;
      };
      req.user = decoded;
      return next();
    }

    // Direct browser navigation / download request fallback using httpOnly refresh_token cookie
    if (req.cookies?.refresh_token) {
      try {
        const decodedRefresh = AuthService.verifyRefreshToken(req.cookies.refresh_token);
        req.user = {
          id: decodedRefresh.id,
          email: decodedRefresh.email,
        };
        return next();
      } catch (refreshErr) {
        logger.warn(`Refresh token validation failed in authMiddleware: ${(refreshErr as Error).message}`);
      }
    }

    return res.status(401).json({ status: "error", message: "Authentication required: No token provided." });
  } catch (error) {
    logger.warn(`Unauthorized access attempt: ${(error as Error).message}`);
    return res.status(401).json({ status: "error", message: "Invalid or expired session token." });
  }
};
