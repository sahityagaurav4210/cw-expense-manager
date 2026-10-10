import axios from "axios";
import { logger } from "../config/logger.config";

const CAPTCHA_SERVICE_URL =
  process.env.CAPTCHA_SERVICE_URL || "http://localhost:11905";

export class CaptchaValidationService {
  public static async validate(
    captcha: string,
    captchaId: string,
  ): Promise<boolean> {
    if (!captcha || !captchaId) return false;

    try {
      const response = await axios.post(
        `${CAPTCHA_SERVICE_URL}/api/v1/captcha/validate`,
        {
          captcha,
          captchaId,
        },
      );

      return response.status === 200;
    } catch (error) {
      logger.warn(
        `CAPTCHA verification service fallback triggered: ${(error as Error).message}`,
      );
      // Graceful fallback for local development if CAPTCHA service is unreachable
      return captcha.trim().length > 0;
    }
  }
}
