import fs from 'node:fs';
import path from 'node:path';
import { NextFunction, Request, Response } from 'express';

export function globalRequestLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  fs.appendFileSync(
    path.join(process.cwd(), 'requests.log'),
    `[${new Date().toISOString()}] ${request.method} ${request.originalUrl} (url: ${request.url}) from ${request.ip}\n`,
  );
  next();
}
