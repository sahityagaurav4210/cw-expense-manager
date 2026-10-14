import { ApiStatus } from "../constants.js";

export class ApiResponse {
  constructor();
  constructor(status: ApiStatus, reqId: string);
  constructor(status: ApiStatus, reqId: string, data: Record<string, unknown>);
  constructor(
    public status: ApiStatus = ApiStatus.SUCCESS,
    public reqId: string = "",
    public data: Record<string, unknown> = {},
  ) {}

  public get STATUS(): ApiStatus {
    return this.status;
  }

  public get REQ_ID(): string {
    return this.reqId;
  }

  public get DATA(): Record<string, unknown> {
    return this.data;
  }

  public set STATUS(value: ApiStatus) {
    this.status = value;
  }

  public set REQ_ID(value: string) {
    this.reqId = value;
  }

  public set DATA(value: Record<string, unknown>) {
    this.data = value;
  }
}
