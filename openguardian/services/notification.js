import nodemailer from "nodemailer";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_CHAT_ID } from "./config.js";

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email service not configured. Skipping email to:", to);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || "no-reply@dataguardian.com",
      to,
      subject,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${to}`);
  } catch (error) {
    console.error("Email send error:", error.message);
  }
}

export async function sendTelegram(chatId: string, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_BOT_CHAT_ID) {
    console.log("Telegram service not configured. Skipping message.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      parse_mode: "HTML"
    };

    const response = await axios.post(url, body);
    console.log("Telegram message sent:", response.status);
  } catch (error) {
    console.error("Telegram send error:", error.message);
  }
}

export async function sendWhatsApp(phoneNumber: string, text: string): Promise<void> {
  // Mock WhatsApp - in production would use Twilio/WhatsApp Business API
  console.log("WhatsApp message to:", phoneNumber, "\n", text);
  // TODO: Integrate with WhatsApp Business API
}

export async function sendSMS(phoneNumber: string, text: string): Promise<void> {
  // Mock SMS - in production would use Twilio
  console.log("SMS to:", phoneNumber, "\n", text);
  // TODO: Integrate with Twilio/SMS API
}

export async function sendNotification(channel: string, recipient: string, message: string): Promise<void> {
  switch (channel) {
    case "email":
      await sendEmail(recipient, "DataGuardian Alert", message);
      break;
    case "telegram":
      await sendTelegram(recipient, message);
      break;
    case "whatsapp":
      await sendWhatsApp(recipient, message);
      break;
    case "sms":
      await sendSMS(recipient, message);
      break;
    default:
      console.log("Unknown channel:", channel);
  }
}