import nodemailer, { type Transporter } from "nodemailer";

export class NodeMailer {
  private static instance: Transporter;
  private static readonly SMTP_HOST = process.env.SMTP_HOST;
  private static readonly SMTP_PORT = process.env.SMTP_PORT
    ? Number.parseInt(process.env.SMTP_PORT, 10)
    : undefined;
  private static readonly SMTP_USER = process.env.SMTP_USER;
  private static readonly SMTP_PASS = process.env.SMTP_PASS;

  private constructor() {}

  public static getInstance(): Transporter {
    if (NodeMailer.instance) return NodeMailer.instance;

    if (
      !NodeMailer.SMTP_HOST ||
      !NodeMailer.SMTP_PORT ||
      !NodeMailer.SMTP_USER ||
      !NodeMailer.SMTP_PASS
    ) {
      throw new Error(
        "SMTP configuration environment variables are not properly set.",
      );
    }

    NodeMailer.instance = nodemailer.createTransport({
      host: NodeMailer.SMTP_HOST,
      port: NodeMailer.SMTP_PORT,
      secure: NodeMailer.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: NodeMailer.SMTP_USER,
        pass: NodeMailer.SMTP_PASS,
      },
    });

    return NodeMailer.instance;
  }

  public static get SMTPConfig() {
    return {
      host: NodeMailer.SMTP_HOST,
      user: NodeMailer.SMTP_USER,
    };
  }
}
