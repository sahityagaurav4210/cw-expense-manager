import type { Request, Response } from "express";
import { ApiStatus, HttpStatus } from "../constants.js";
import { RequestManager } from "../config/index.js";
import { ApiResponse } from "../api/index.js";
import { SystemHelper } from "../helpers/index.js";

export function pingController(request: Request, response: Response): Response {
  RequestManager.incrementReqId();
  return response.status(HttpStatus.OK).send("Pong\n");
}

export function healthCheckController(
  request: Request,
  response: Response,
): Response {
  const reqId = RequestManager.getNextReqId();
  const reply = new ApiResponse();

  const systemStatistics = SystemHelper.getSystemStatistics();

  reply.STATUS = ApiStatus.SUCCESS;
  reply.REQ_ID = reqId;
  reply.DATA = systemStatistics;

  return response.status(HttpStatus.OK).json(reply);
}
