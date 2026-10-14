import {
  ServerManager,
  LoggerManager,
  RequestManager,
} from "../config/index.js";
import { Publisher, Subscriber } from "../redis/index.js";
import { FileHelper } from "../helpers/index.js";
import { AppEnvironments } from "../constants.js";

export class Server {
  private static readonly PORT = process.env.PORT;
  private static readonly HOST = process.env.HOST;
  private static readonly ENV = process.env.APP_ENV || AppEnvironments.LOCAL;
  private static readonly PID = process.pid;

  private constructor() {}

  public static async start(): Promise<void> {
    const app = await ServerManager.getInstance();
    const logger = LoggerManager.getInstance();

    if (!this.PORT || !this.HOST) {
      logger.error("PORT and HOST must be defined in environment variables.");
      process.exit(1);
    }

    LoggerManager.initialize();
    await Subscriber.initialize();

    const redisInstance = await Publisher.initialize();
    await RequestManager.initialize(redisInstance);

    app.listen(Number(this.PORT), this.HOST);

    const banner = await FileHelper.readFile(
      FileHelper.getAbsolutePath("./banner.txt"),
    );

    console.log(banner);
    console.log(
      `\x1b[32m\x1b[1mApp started successfully with PID ${this.PID} and is running in ${this.ENV} mode.\x1b[0m 🚀🚀🚀🚀`,
    );
  }
}
