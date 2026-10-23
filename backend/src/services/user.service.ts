import { User } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";
import { TotpService } from "./totp.service";
import { redisClient } from "../config/redis.config";

export class UserService {
  public static async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "name",
        "email",
        "phone_no",
        "employment_type",
        "annual_income",
        "profile_photo_url",
        "two_factor_method",
        "is_authenticator_enabled",
        "created_at",
        "updated_at",
      ],
    });
    if (!user) {
      throw new Error("User not found.");
    }
    const userData = user.toJSON() as any;
    userData.profile_photo = userData.profile_photo_url;
    userData.annual_income = user.annual_income !== null && user.annual_income !== undefined ? Number(user.annual_income) : null;
    userData.two_factor_method = user.two_factor_method || "EMAIL";
    userData.is_authenticator_enabled = Boolean(user.is_authenticator_enabled);
    return userData;
  }

  public static async updateProfile(
    userId: number,
    updateData: {
      name?: string;
      phone_no?: string;
      employment_type?: "Salaried" | "Self-Employed";
      annual_income?: number | string | null;
      captchaText: string;
      captchaId?: number;
    },
    profilePhotoUrl?: string
  ) {
    const isCaptchaValid = await CaptchaValidationService.validate(updateData.captchaText, updateData.captchaId ? String(updateData.captchaId) : "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (updateData.name) user.name = updateData.name;
    if (updateData.phone_no !== undefined) user.phone_no = updateData.phone_no;
    if (updateData.employment_type) user.employment_type = updateData.employment_type;
    if (updateData.annual_income !== undefined) {
      user.annual_income =
        updateData.annual_income === "" || updateData.annual_income === null
          ? (null as any)
          : Number(updateData.annual_income);
    }
    if (profilePhotoUrl) user.profile_photo_url = profilePhotoUrl;

    await user.save();

    // Return the updated user without the password
    const { password, ...userWithoutPassword } = user.toJSON() as any;
    userWithoutPassword.profile_photo = userWithoutPassword.profile_photo_url;
    return userWithoutPassword;
  }

  /**
   * Retrieves user 2FA configuration status
   */
  public static async get2FaSettings(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: ["id", "email", "two_factor_method", "is_authenticator_enabled"],
    });
    if (!user) {
      throw new Error("User not found.");
    }

    return {
      twoFactorMethod: user.two_factor_method || "EMAIL",
      isAuthenticatorEnabled: Boolean(user.is_authenticator_enabled),
      email: user.email,
    };
  }

  /**
   * Generates a new Authenticator App secret and QR code URL for user configuration
   */
  public static async setupAuthenticator(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const secret = TotpService.generateSecret(20);
    const otpAuthUrl = TotpService.generateOtpAuthUrl(user.email, secret);
    const qrCodeUrl = TotpService.generateQrCodeUrl(otpAuthUrl);

    // Save pending setup in Redis for 10 minutes
    await redisClient.set(`2fa:setup:${userId}`, secret, "EX", 600);

    return {
      secret,
      otpAuthUrl,
      qrCodeUrl,
    };
  }

  /**
   * Verifies the 6-digit TOTP code and activates Authenticator App
   */
  public static async verifyAuthenticatorSetup(userId: number, code: string, setAsDefault: boolean = true) {
    if (!code || code.trim().length !== 6) {
      throw new Error("Please enter a valid 6-digit verification code.");
    }

    const pendingSecret = await redisClient.get(`2fa:setup:${userId}`);
    if (!pendingSecret) {
      throw new Error("Setup session has expired. Please initiate setup again.");
    }

    const appEnv = (process.env.APP_ENV || "local").trim().toLowerCase();
    const defaultOtp = process.env.DEFAULT_OTP || "123456";
    const isLocal = appEnv === "local";

    const isValid =
      TotpService.verifyTotp(code.trim(), pendingSecret) ||
      (isLocal && code.trim() === defaultOtp);

    if (!isValid) {
      throw new Error("Invalid verification code. Please check your Authenticator App and try again.");
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    user.authenticator_secret = pendingSecret;
    user.is_authenticator_enabled = true;
    user.two_factor_method = "AUTHENTICATOR";
    await user.save();

    await redisClient.del(`2fa:setup:${userId}`);

    return {
      message: "Authenticator App has been successfully configured and activated.",
      isAuthenticatorEnabled: true,
      twoFactorMethod: "AUTHENTICATOR",
    };
  }

  /**
   * Updates default 2FA method ('EMAIL' | 'AUTHENTICATOR')
   */
  public static async update2FaMethod(userId: number, method: "EMAIL" | "AUTHENTICATOR") {
    if (!["EMAIL", "AUTHENTICATOR"].includes(method)) {
      throw new Error("Invalid 2FA method selected. Must be EMAIL or AUTHENTICATOR.");
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (method === "AUTHENTICATOR" && (!user.is_authenticator_enabled || !user.authenticator_secret)) {
      throw new Error("Authenticator App must be configured before setting it as your default 2FA method.");
    }

    user.two_factor_method = method;
    await user.save();

    return {
      message: `Default 2FA method updated to ${method === "EMAIL" ? "Email" : "Authenticator App"}.`,
      twoFactorMethod: user.two_factor_method,
    };
  }

  /**
   * Disables Authenticator App and reverts default 2FA method back to Email
   */
  public static async disableAuthenticator(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    user.is_authenticator_enabled = false;
    user.authenticator_secret = null as any;
    user.two_factor_method = "EMAIL";
    await user.save();

    return {
      message: "Authenticator App has been disabled. Default 2FA method reverted to Email.",
      isAuthenticatorEnabled: false,
      twoFactorMethod: "EMAIL",
    };
  }
}
