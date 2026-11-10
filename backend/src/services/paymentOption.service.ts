import { PaymentOptionsMaster } from '../db/models';
import { redisClient } from '../config/redis.config';
import { CaptchaValidationService } from './captchaValidation.service';
import { logger } from '../config/logger.config';

const REDIS_PAYMENT_OPTIONS_KEY = 'payment_options:master:v1';

export class PaymentOptionService {
  public static async getAllPaymentOptions() {
    try {
      const cached = await redisClient.get(REDIS_PAYMENT_OPTIONS_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn(`Redis payment options fetch failed: ${(err as Error).message}`);
    }

    const options = await PaymentOptionsMaster.findAll({
      where: { is_deleted: false },
      order: [['id', 'DESC']],
    });

    try {
      await redisClient.set(REDIS_PAYMENT_OPTIONS_KEY, JSON.stringify(options), 'EX', 3600);
    } catch {}

    return options;
  }

  public static async createPaymentOption(data: any) {
    const isCaptchaValid = await CaptchaValidationService.validate(
      data.captchaText,
      data.captchaId || 'default'
    );
    if (!isCaptchaValid) {
      throw new Error('Invalid CAPTCHA verification code.');
    }

    const paymentName = data.payment_name || data.PaymentName || data.name;
    if (!paymentName) {
      throw new Error('Payment name is required.');
    }

    const isActive =
      data.is_active !== undefined
        ? Boolean(data.is_active)
        : data.isActive !== undefined
        ? Boolean(data.isActive)
        : true;

    const paymentOption = await PaymentOptionsMaster.create({
      payment_name: paymentName,
      is_active: isActive,
      is_deleted: false,
    });

    await redisClient.del(REDIS_PAYMENT_OPTIONS_KEY).catch(() => {});
    return paymentOption;
  }

  public static async toggleActiveStatus(id: number, captchaText: string, captchaId?: string) {
    const isCaptchaValid = await CaptchaValidationService.validate(
      captchaText,
      captchaId || 'default'
    );
    if (!isCaptchaValid) {
      throw new Error('Invalid CAPTCHA verification code.');
    }

    const option = await PaymentOptionsMaster.findByPk(id);
    if (!option || option.is_deleted) {
      throw new Error('Payment option not found.');
    }

    option.is_active = !option.is_active;
    await option.save();

    await redisClient.del(REDIS_PAYMENT_OPTIONS_KEY).catch(() => {});
    return option;
  }

  public static async deletePaymentOption(id: number, captchaText: string, captchaId?: string) {
    const isCaptchaValid = await CaptchaValidationService.validate(
      captchaText,
      captchaId || 'default'
    );
    if (!isCaptchaValid) {
      throw new Error('Invalid CAPTCHA verification code.');
    }

    const option = await PaymentOptionsMaster.findByPk(id);
    if (!option) {
      throw new Error('Payment option not found.');
    }

    option.is_deleted = true;
    option.is_active = false;
    await option.save();

    await redisClient.del(REDIS_PAYMENT_OPTIONS_KEY).catch(() => {});
    return { success: true, message: 'Payment option marked as deleted.' };
  }
}
