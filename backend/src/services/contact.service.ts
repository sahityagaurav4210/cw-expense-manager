import { Contact } from "../models";
import { Op } from "sequelize";
import { CaptchaValidationService } from "./captchaValidation.service";

export class ContactService {
  public static async getContacts(
    userId: number,
    filters?: { category?: string; search?: string }
  ) {
    const where: any = { user_id: userId };

    if (filters?.category && filters.category !== "ALL") {
      where.category = filters.category;
    }

    if (filters?.search && filters.search.trim() !== "") {
      const q = `%${filters.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: q } },
        { phone: { [Op.iLike]: q } },
        { email: { [Op.iLike]: q } },
        { company: { [Op.iLike]: q } },
      ];
    }

    const contacts = await Contact.findAll({
      where,
      order: [
        ["is_favorite", "DESC"],
        ["name", "ASC"],
        ["created_at", "DESC"],
      ],
    });

    return contacts;
  }

  public static async getContactsList(userId: number) {
    const contacts = await Contact.findAll({
      where: { user_id: userId },
      attributes: ["id", "name", "phone", "email", "category", "profile_photo"],
      order: [["name", "ASC"]],
    });

    return contacts;
  }

  public static async getContactById(userId: number, contactId: number) {
    const contact = await Contact.findOne({
      where: { id: contactId, user_id: userId },
    });
    if (!contact) {
      throw new Error("Contact not found.");
    }
    return contact;
  }

  public static async createContact(
    userId: number,
    data: any,
    file?: Express.Multer.File
  ) {
    if (data.captchaText) {
      const isCaptchaValid = await CaptchaValidationService.validate(
        data.captchaText,
        data.captchaId || "default"
      );
      if (!isCaptchaValid) {
        throw new Error("Invalid CAPTCHA verification code.");
      }
    }

    const isFav =
      data.is_favorite === true ||
      data.is_favorite === "true" ||
      data.is_favorite === 1 ||
      data.is_favorite === "1";

    const profilePhoto = file ? `/uploads/${file.filename}` : data.profile_photo || null;

    const contact = await Contact.create({
      user_id: userId,
      name: data.name?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim() || null,
      profile_photo: profilePhoto,
      company: data.company?.trim() || null,
      job_title: data.job_title?.trim() || null,
      category: data.category?.trim() || "Other",
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      is_favorite: isFav,
    });

    return contact;
  }

  public static async updateContact(
    userId: number,
    contactId: number,
    data: any,
    file?: Express.Multer.File
  ) {
    if (data.captchaText) {
      const isCaptchaValid = await CaptchaValidationService.validate(
        data.captchaText,
        data.captchaId || "default"
      );
      if (!isCaptchaValid) {
        throw new Error("Invalid CAPTCHA verification code.");
      }
    }

    const contact = await Contact.findOne({
      where: { id: contactId, user_id: userId },
    });
    if (!contact) {
      throw new Error("Contact not found.");
    }

    if (data.name !== undefined) contact.name = data.name.trim();
    if (data.phone !== undefined) contact.phone = data.phone.trim();
    if (data.email !== undefined) contact.email = data.email ? data.email.trim() : null;
    if (data.company !== undefined) contact.company = data.company ? data.company.trim() : null;
    if (data.job_title !== undefined) contact.job_title = data.job_title ? data.job_title.trim() : null;
    if (data.category !== undefined) contact.category = data.category ? data.category.trim() : "Other";
    if (data.address !== undefined) contact.address = data.address ? data.address.trim() : null;
    if (data.notes !== undefined) contact.notes = data.notes ? data.notes.trim() : null;
    if (data.is_favorite !== undefined) {
      contact.is_favorite =
        data.is_favorite === true ||
        data.is_favorite === "true" ||
        data.is_favorite === 1 ||
        data.is_favorite === "1";
    }

    if (file) {
      contact.profile_photo = `/uploads/${file.filename}`;
    } else if (data.remove_photo === true || data.remove_photo === "true") {
      contact.profile_photo = null;
    }

    await contact.save();
    return contact;
  }

  public static async deleteContact(
    userId: number,
    contactId: number,
    captchaText?: string,
    captchaId?: any
  ) {
    if (captchaText) {
      const isCaptchaValid = await CaptchaValidationService.validate(
        captchaText,
        captchaId || "default"
      );
      if (!isCaptchaValid) {
        throw new Error("Invalid CAPTCHA verification code.");
      }
    }

    const contact = await Contact.findOne({
      where: { id: contactId, user_id: userId },
    });
    if (!contact) {
      throw new Error("Contact not found.");
    }

    await contact.destroy();
    return { message: `Contact "${contact.name}" deleted successfully.` };
  }

  public static async toggleFavorite(userId: number, contactId: number) {
    const contact = await Contact.findOne({
      where: { id: contactId, user_id: userId },
    });
    if (!contact) {
      throw new Error("Contact not found.");
    }

    contact.is_favorite = !contact.is_favorite;
    await contact.save();
    return contact;
  }
}
