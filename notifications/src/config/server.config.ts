import express, { type Application } from "express";
import AppRoutes from "../routes/index.js";
import { Publisher } from "../redis/index.js";
import { RequestManager } from "../config/index.js";
import { RedisConstants } from "../constants.js";

export class ServerManager {
  private static instance: Application;
  private static readonly JSON_LIMIT = process.env.JSON_LIMIT || "1kb";
  private static readonly URLENCODED_LIMIT =
    process.env.URLENCODED_LIMIT || "1kb";

  private constructor() {}

  private static async initialize(): Promise<void> {
    const app = express();
    const redisInstance = await Publisher.getInstance();

    app.disable("x-powered-by");
    app.use(express.json({ limit: this.JSON_LIMIT }));
    app.use(
      express.urlencoded({
        extended: true,
        limit: this.URLENCODED_LIMIT,
      }),
    );
    app.use("/api/v1", AppRoutes);
    app.set("trust proxy", true);

    process.on("SIGINT", async function (signal) {
      console.log(`Received signal - ${signal}, shutting down...`);
      const currentReqId = RequestManager.getCurrentReqId();

      await redisInstance.set(
        `${RedisConstants.REQUEST_KEY_PREFIX}:req-id`,
        currentReqId,
      );
      process.exit(0);
    });

    ServerManager.instance = app;
  }

  public static async getInstance(): Promise<Application> {
    if (!ServerManager.instance) {
      await ServerManager.initialize();
    }

    return ServerManager.instance;
  }
}
