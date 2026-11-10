import { Request, Response } from "express";
import { PaymentOptionService } from "../services/paymentOption.service";
import { paymentOptionSchema } from "../validators";

export class PaymentOptionController {
  public static async getAll(req: Request, res: Response) {
    try {
      const paymentOptions = await PaymentOptionService.getAllPaymentOptions();
      return res.status(200).json({ status: "success", data: paymentOptions });
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { error, value } = paymentOptionSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const paymentOption = await PaymentOptionService.createPaymentOption(value);
      return res.status(201).json({
        status: "success",
        message: "Payment option created successfully.",
        data: paymentOption,
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async toggleActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { captchaText, captchaId } = req.body;
      if (!captchaText) {
        return res.status(400).json({ status: "error", message: "CAPTCHA text is required." });
      }

      const updated = await PaymentOptionService.toggleActiveStatus(
        parseInt(id, 10),
        captchaText,
        captchaId
      );
      return res.status(200).json({
        status: "success",
        message: "Payment option active status toggled.",
        data: updated,
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { captchaText, captchaId } = req.body;
      if (!captchaText) {
        return res.status(400).json({ status: "error", message: "CAPTCHA text is required." });
      }

      const result = await PaymentOptionService.deletePaymentOption(
        parseInt(id, 10),
        captchaText,
        captchaId
      );
      return res.status(200).json({ status: "success", message: result.message });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }
}
