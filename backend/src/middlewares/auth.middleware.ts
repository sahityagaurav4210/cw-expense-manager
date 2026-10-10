import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../config/logger.config";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "cw_expense_tracker_jwt_secret_key_2026";

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.access_token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ status: "error", message: "Authentication required: No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; name: string };
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Unauthorized access attempt: ${(error as Error).message}`);
    return res.status(401).json({ status: "error", message: "Invalid or expired session token." });
  }
};
