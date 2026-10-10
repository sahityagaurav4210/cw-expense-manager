import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger.config";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error processing request ${req.method} ${req.url}: ${err.message}`, { stack: err.stack });

  return res.status(500).json({
    status: "error",
    message: err.message || "An unexpected error occurred on the server.",
  });
};
