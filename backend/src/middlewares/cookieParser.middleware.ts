import { Request, Response, NextFunction } from "express";

export function cookieParser(req: Request, _res: Response, next: NextFunction) {
  const cookieHeader = req.headers.cookie;
  (req as any).cookies = {};
  if (cookieHeader) {
    const rawCookies = cookieHeader.split(";");
    for (const rawCookie of rawCookies) {
      const parts = rawCookie.split("=");
      const key = parts[0]?.trim();
      const val = parts.slice(1).join("=").trim();
      if (key) {
        try {
          (req as any).cookies[key] = decodeURIComponent(val);
        } catch {
          (req as any).cookies[key] = val;
        }
      }
    }
  }
  next();
}
