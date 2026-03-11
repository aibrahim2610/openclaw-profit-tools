export async function sendEmail(email: string, subject: string, text: string): Promise<void> {
  console.log(`Email to: ${email}\nSubject: ${subject}\nMessage: ${text}\n---\n`);
}

export async function sendTelegram(chatId: string, text: string): Promise<void> {
  console.log(`Telegram to: ${chatId}\nMessage: ${text}\n---\n`);
}

export async function sendWhatsApp(phoneNumber: string, text: string): Promise<void> {
  console.log(`WhatsApp to: ${phoneNumber}\nMessage: ${text}\n---\n`);
}

export async function sendSMS(phoneNumber: string, text: string): Promise<void> {
  console.log(`SMS to: ${phoneNumber}\nMessage: ${text}\n---\n`);
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