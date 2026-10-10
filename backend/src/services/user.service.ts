import { User } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";

export class UserService {
  public static async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "phone_no", "employment_type", "profile_photo_url", "created_at", "updated_at"],
    });
    if (!user) {
      throw new Error("User not found.");
    }
    return user;
  }

  public static async updateProfile(userId: number, updateData: { name?: string; phone_no?: string; employment_type?: "Salaried" | "Self-Employed"; captchaText: string; captchaId?: number }, profilePhotoUrl?: string) {
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
    if (profilePhotoUrl) user.profile_photo_url = profilePhotoUrl;

    await user.save();

    // Return the updated user without the password
    const { password, ...userWithoutPassword } = user.toJSON() as any;
    return userWithoutPassword;
  }
}
