import { Request, Response, NextFunction } from "express";

/**
 * Rate Limiting Middleware (Migrated to Spring Boot API Gateway)
 * 
 * As the Node backend is an internal service accessed only via the Spring Boot
 * API Gateway (http://localhost:8080), HTTP rate limiting is enforced at the
 * gateway layer to prevent throttling valid proxied traffic.
 * 
 * This pass-through middleware is maintained for backwards compatibility.
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  next();
};

export default rateLimiter;
