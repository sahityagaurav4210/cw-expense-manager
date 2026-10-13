import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ContactService } from "../services/contact.service";
import { contactSchema } from "../validators";

export class ContactController {
  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const category = typeof req.query.category === "string" ? req.query.category : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;

      const contacts = await ContactService.getContacts(userId, { category, search });
      return res.status(200).json({
        status: "success",
        data: contacts,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: (err as Error).message,
      });
    }
  }

  public static async getList(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const contacts = await ContactService.getContactsList(userId);
      return res.status(200).json({
        status: "success",
        data: contacts,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: (err as Error).message,
      });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const contactId = parseInt(req.params.id, 10);
      if (isNaN(contactId)) {
        return res.status(400).json({ status: "error", message: "Invalid contact ID." });
      }

      const contact = await ContactService.getContactById(userId, contactId);
      return res.status(200).json({
        status: "success",
        data: contact,
      });
    } catch (err) {
      return res.status(404).json({
        status: "error",
        message: (err as Error).message,
      });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const { error, value } = contactSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: error.details[0].message,
        });
      }

      const contact = await ContactService.createContact(userId, value, req.file);
      return res.status(201).json({
        status: "success",
        message: "Contact created successfully.",
        data: contact,
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: (err as Error).message,
      });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const contactId = parseInt(req.params.id, 10);
      if (isNaN(contactId)) {
        return res.status(400).json({ status: "error", message: "Invalid contact ID." });
      }

      const { error, value } = contactSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: "error",
          message: error.details[0].message,
        });
      }

      const contact = await ContactService.updateContact(userId, contactId, value, req.file);
      return res.status(200).json({
        status: "success",
        message: "Contact updated successfully.",
        data: contact,
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: (err as Error).message,
      });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const contactId = parseInt(req.params.id, 10);
      if (isNaN(contactId)) {
        return res.status(400).json({ status: "error", message: "Invalid contact ID." });
      }

      const result = await ContactService.deleteContact(
        userId,
        contactId,
        req.body?.captchaText,
        req.body?.captchaId
      );
      return res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: (err as Error).message,
      });
    }
  }

  public static async toggleFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const contactId = parseInt(req.params.id, 10);
      if (isNaN(contactId)) {
        return res.status(400).json({ status: "error", message: "Invalid contact ID." });
      }

      const contact = await ContactService.toggleFavorite(userId, contactId);
      return res.status(200).json({
        status: "success",
        message: contact.is_favorite
          ? `Marked "${contact.name}" as favorite.`
          : `Removed "${contact.name}" from favorites.`,
        data: contact,
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: (err as Error).message,
      });
    }
  }
}
