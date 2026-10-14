import fs from "node:fs/promises";
import { NodeMailer, LoggerManager } from "../config/index.js";
import { validateRecords } from "../helpers/index.js";

export async function handleLoginUpdates(message: string): Promise<void> {
  const logger = LoggerManager.getInstance();

  try {
    const loginData = JSON.parse(message);
    const { content, timestamp } = loginData || {};
    const { email, ipAddress, link, supportUrl, username, subject } =
      content || {};

    if (
      !email ||
      !ipAddress ||
      !timestamp ||
      !link ||
      !supportUrl ||
      !username ||
      !subject
    ) {
      console.warn(
        "Received login update message with missing fields:",
        loginData,
      );
      return;
    }

    const loginUpdateTemplate = (
      await fs.readFile("./templates/login-update.html", "utf-8")
    )
      .toString()
      .replace("{{ipAddress}}", ipAddress)
      .replace("{{timestamp}}", timestamp)
      .replace("{{link}}", link)
      .replace("{{supportUrl}}", supportUrl)
      .replace("{{userName}}", username)
      .replace("{{subject}}", subject);

    const transporter = NodeMailer.getInstance();
    const mailOptions = {
      from: `Coding Works <${NodeMailer.SMTPConfig.user}>`,
      to: email,
      subject: "New sign-in detected",
      text: "This is the plain text body of the email.",
      html: loginUpdateTemplate,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Mail sent successfully to ${email} for login update notification.`,
    );
  } catch (error) {
    logger.error(
      "Error occurred while sending login update notification:",
      error,
    );
  }
}

export async function handleFailedLoginUpdates(message: string): Promise<void> {
  const logger = LoggerManager.getInstance();

  try {
    const loginData = JSON.parse(message);
    const { content, timestamp } = loginData || {};
    const { email, ipAddress, link, supportUrl, username, subject } =
      content || {};

    if (
      !email ||
      !ipAddress ||
      !timestamp ||
      !link ||
      !supportUrl ||
      !username ||
      !subject
    ) {
      console.warn(
        "Received failed login update message with missing fields:",
        loginData,
      );
      return;
    }

    const failedLoginTemplate = (
      await fs.readFile("./templates/unsuccessful-login.html", "utf-8")
    )
      .toString()
      .replace("{{ipAddress}}", ipAddress)
      .replace("{{timestamp}}", timestamp)
      .replace("{{link}}", link)
      .replace("{{supportUrl}}", supportUrl)
      .replace("{{userName}}", username)
      .replace("{{subject}}", subject);

    const transporter = NodeMailer.getInstance();
    const mailOptions = {
      from: `Coding Works <${NodeMailer.SMTPConfig.user}>`,
      to: email,
      subject: subject || "Security Alert: Unsuccessful login attempt detected",
      text: "An unsuccessful login attempt was detected on your account.",
      html: failedLoginTemplate,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Mail sent successfully to ${email} for failed login notification.`,
    );
  } catch (error) {
    logger.error(
      "Error occurred while sending failed login notification:",
      error,
    );
  }
}

export async function handleWelcomeEmail(message: string): Promise<void> {
  const logger = LoggerManager.getInstance();

  try {
    const loginData = JSON.parse(message);
    const { content, timestamp } = loginData || {};
    const {
      email,
      supportEmail,
      userName,
      subject,
      name,
      dob,
      category,
      gender,
      otp,
    } = content || {};

    if (
      !email ||
      !timestamp ||
      !userName ||
      !subject ||
      !supportEmail ||
      !name ||
      !dob ||
      !category ||
      !gender ||
      !otp
    ) {
      logger.warn(
        "Received login update message with missing fields:",
        loginData,
      );
      return;
    }

    const welcomeEmail = (
      await fs.readFile("./templates/welcome.html", "utf-8")
    )
      .toString()
      .replaceAll("{{name}}", name)
      .replace("{{dob}}", dob)
      .replace("{{category}}", category)
      .replace("{{gender}}", gender)
      .replace("{{email}}", email)
      .replace("{{timestamp}}", timestamp)
      .replace("{{supportEmail}}", supportEmail)
      .replace("{{userName}}", userName)
      .replace("{{subject}}", subject)
      .replace("{{otp}}", otp);

    const transporter = NodeMailer.getInstance();
    const mailOptions = {
      from: `Coding Works <${NodeMailer.SMTPConfig.user}>`,
      to: email,
      subject: "Thanks for choosing us!!!",
      text: "This is the plain text body of the email.",
      html: welcomeEmail,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Mail sent successfully to ${email} for welcome email notification.`,
    );
  } catch (error) {
    logger.error(
      "Error occurred while sending login update notification:",
      error,
    );
  }
}

export async function handleOTP(message: string): Promise<void> {
  const logger = LoggerManager.getInstance();

  try {
    const loginData = JSON.parse(message);
    const { content, timestamp } = loginData || {};
    const { email, supportEmail, userName, subject, name, otp } = content || {};

    if (
      !email ||
      !timestamp ||
      !userName ||
      !subject ||
      !supportEmail ||
      !name ||
      !otp
    ) {
      logger.warn(
        "Received login update message with missing fields:",
        loginData,
      );
      return;
    }

    const otpEmail = (await fs.readFile("./templates/otp.html", "utf-8"))
      .toString()
      .replaceAll("{{name}}", name)
      .replace("{{email}}", email)
      .replace("{{timestamp}}", timestamp)
      .replace("{{supportEmail}}", supportEmail)
      .replace("{{userName}}", userName)
      .replace("{{subject}}", subject)
      .replace("{{otp}}", otp);

    const transporter = NodeMailer.getInstance();
    const mailOptions = {
      from: `Coding Works <${NodeMailer.SMTPConfig.user}>`,
      to: email,
      subject: "Your new OTP",
      text: "This is the plain text body of the email.",
      html: otpEmail,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Mail sent successfully to ${email} for otp email notification.`,
    );
  } catch (error) {
    logger.error(
      "Error occurred while sending login update notification:",
      error,
    );
  }
}

export async function handleSkillAddition(message: string) {
  try {
    const skillData = JSON.parse(message);
    const { content, timestamp } = skillData || {};
    const { email, username, skillName, link, subject, skillExperience } =
      content || {};

    if (
      !email ||
      !username ||
      !skillName ||
      !link ||
      !timestamp ||
      !subject ||
      !skillExperience
    ) {
      console.warn(
        "Received skill addition message with missing fields:",
        skillData,
      );
      return;
    }

    const skillAdditionTemplate = (
      await fs.readFile("./templates/add-skill.html", "utf-8")
    )
      .toString()
      .replace("{{userName}}", username)
      .replace("{{skillName}}", skillName)
      .replace("{{supportUrl}}", link)
      .replace("{{subject}}", subject)
      .replace("{{timestamp}}", timestamp)
      .replace("{{skillExperience}}", skillExperience);

    const transporter = NodeMailer.getInstance();
    const mailOptions = {
      from: `Coding Works <${NodeMailer.SMTPConfig.user}>`,
      to: email,
      subject: "New Skill Added",
      text: "This is the plain text body of the email.",
      html: skillAdditionTemplate,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `Mail sent successfully to ${email} for skill addition notification.`,
    );
  } catch (error) {
    console.error(
      "Error occurred while sending skill addition notification:",
      error,
    );
  }
}

export async function handleSkillUpdate(message: string) {
  const logger = LoggerManager.getInstance();

  try {
    const skillData = JSON.parse(message);
    const { content, timestamp } = skillData || {};
    const { email, username, link, subject, skill } = content || {};

    if (!email || !username || !link || !timestamp || !subject) {
      logger.warn("Received skill update message with missing fields");
      return;
    }

    if (!validateRecords(skill)) {
      logger.warn("Received skill update message with invalid skill data:");
      return;
    }

    const {
      skillName,
      skillExperience,
      skillDesc,
      newSkillName,
      newSkillExperience,
      newSkillDesc,
    } = skill || {};

    const skillUpdateTemplate = (
      await fs.readFile("./templates/update-skill.html", "utf-8")
    )
      .toString()
      .replace("{{userName}}", username)
      .replace("{{skillName}}", skillName)
      .replace("{{supportUrl}}", link)
      .replace("{{subject}}", subject)
      .replace("{{timestamp}}", timestamp)
      .replace("{{skillExperience}}", skillExperience)
      .replace("{{skillDesc}}", skillDesc)
      .replace("{{newSkillName}}", newSkillName)
      .replace("{{newSkillExperience}}", newSkillExperience)
      .replace("{{newSkillDesc}}", newSkillDesc);

    const transporter = NodeMailer.getInstance();
    const mailOptions = {
      from: `Coding Works <${NodeMailer.SMTPConfig.user}>`,
      to: email,
      subject: "Skill Updated",
      text: "This is the plain text body of the email.",
      html: skillUpdateTemplate,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Mail sent successfully to ${email} for skill update notification.`,
    );
  } catch (error) {
    logger.error(
      "Error occurred while sending skill update notification:",
      error,
    );
  }
}

export async function handleProfileUpdate(message: string) {
  const logger = LoggerManager.getInstance();

  try {
    const skillData = JSON.parse(message);
    const { content, timestamp } = skillData || {};
    const { email, ...payload } = content || {};

    if (!email) {
      logger.warn("Received skill update message with missing fields");
      return;
    }

    if (!validateRecords(payload)) {
      logger.warn("Received profile update message with invalid profile data");
      return;
    }

    const { userName, profileLink, link, subject, supportUrl } = payload || {};

    const skillUpdateTemplate = (
      await fs.readFile("./templates/profile-update.html", "utf-8")
    )
      .toString()
      .replace("{{userName}}", userName)
      .replace("{{supportUrl}}", supportUrl)
      .replace("{{subject}}", subject)
      .replace("{{timestamp}}", timestamp)
      .replaceAll("{{profileLink}}", profileLink)
      .replaceAll("{{link}}", link);

    const transporter = NodeMailer.getInstance();
    const mailOptions = {
      from: `Coding Works <${NodeMailer.SMTPConfig.user}>`,
      to: email,
      subject: "Profile Updated",
      text: "This is the plain text body of the email.",
      html: skillUpdateTemplate,
    };

    await transporter.sendMail(mailOptions);
    logger.info(
      `Mail sent successfully to ${email} for profile update notification.`,
    );
  } catch (error) {
    logger.error(
      "Error occurred while sending profile update notification:",
      error,
    );
  }
}
