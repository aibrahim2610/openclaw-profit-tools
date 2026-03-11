// Notifier Agent - JavaScript version
export class NotifierAgent {
  async onMessage(message) {
    if (message.type === "notify:breach") {
      const { email, breaches } = message.payload;
      console.log(`Sending breach notification to ${email}`);
      // Implementation would send email/SMS
    }
    if (message.type === "notify:upsell") {
      const { email, offer } = message.payload;
      console.log(`Sending upsell offer to ${email}`);
    }
  }
}