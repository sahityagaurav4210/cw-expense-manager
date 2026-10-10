import { Request, Response } from "express";

export class AppController {
  public static health(req: Request, res: Response) {
    return res.status(200).json({
      status: "healthy",
      service: "cw-expense-tracker-backend",
      timestamp: new Date().toISOString(),
      message: "App is running perfectly via /api/v1/app/health",
    });
  }
}
