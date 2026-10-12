import axios from "axios";
import { logger } from "../config/logger.config";

export class CaptchaValidationService {
  public static async validate(
    captcha: string,
    captchaId: string | number,
  ): Promise<boolean> {
    if (!captcha || !captchaId) return false;

    // Check for offline/fallback format: fallback_<base64Code>_<timestamp>
    const cidStr = String(captchaId);
    if (cidStr.startsWith("fallback_")) {
      const parts = cidStr.split("_");
      if (parts.length >= 3 && parts[1]) {
        try {
          const expectedCode = Buffer.from(parts[1], "base64").toString(
            "utf-8",
          );
          return (
            captcha.trim().toUpperCase() === expectedCode.trim().toUpperCase()
          );
        } catch {
          return false;
        }
      }
      return false;
    }

    const payload = {
      captcha: String(captcha).trim(),
      captchaId: String(captchaId).trim(),
    };

    // Primary and fallback URLs to ensure local service connectivity (handles IPv4 127.0.0.1 vs localhost)
    const envUrl = process.env.CAPTCHA_SERVICE_URL;
    const urlsToTry: string[] = [];
    if (envUrl) urlsToTry.push(envUrl);
    if (!urlsToTry.includes("http://localhost:11905")) urlsToTry.push("http://localhost:11905");
    if (!urlsToTry.includes("http://127.0.0.1:11905")) urlsToTry.push("http://127.0.0.1:11905");

    for (const baseUrl of urlsToTry) {
      try {
        const response = await axios.post(
          `${baseUrl}/api/v1/captcha/validate`,
          payload,
          {
            validateStatus: (status) => status < 500, // Do not throw on 4xx responses
            timeout: 5000,
          },
        );

        logger.info(
          `CAPTCHA validate response from ${baseUrl}: status=${response.status}, body=${JSON.stringify(response.data)}`,
        );

        return response.status === 200;
      } catch (error: any) {
        logger.warn(
          `CAPTCHA verification attempt at ${baseUrl} failed: ${error.message}`,
        );
        // Continue to next URL fallback if network connection failed
      }
    }

    return false;
  }
}
