import { RedisConstants } from "../constants.js";
import { Redis } from "ioredis";

export class RequestManager {
  private static reqId: number = 0;

  private constructor() {}

  public static async initialize(appRedisInstance: Redis): Promise<void> {
    const requestId = await appRedisInstance.get(
      `${RedisConstants.REQUEST_KEY_PREFIX}:req-id`,
    );

    if (requestId) {
      this.reqId = Number.parseInt(requestId, 10);
    }
  }

  public static incrementReqId(): void {
    ++this.reqId;
  }

  public static getNextReqId(): string {
    ++this.reqId;
    return `cw-pbb-worker-req-${this.reqId.toString().padStart(10, "0")}`;
  }

  public static getCurrentReqId(): string {
    return this.reqId.toString();
  }
}
