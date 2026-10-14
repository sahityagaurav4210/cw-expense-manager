export class SystemHelper {
  private static readonly memoryUsage = Math.floor(
    process.memoryUsage().rss / (1024 * 1024),
  );
  private static readonly uptime = Math.floor(process.uptime() / (60 * 60));
  private static readonly cpuUsage = process.cpuUsage().system;
  private static readonly pid = process.pid;

  private constructor() {}

  public static getSystemStatistics() {
    return {
      memoryUsage: this.memoryUsage,
      uptime: this.uptime,
      cpuUsage: this.cpuUsage,
      pid: this.pid,
    };
  }
}
