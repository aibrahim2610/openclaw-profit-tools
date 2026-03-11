import { Agent } from "openclaw";
import { sendEmail, sendTelegram, sendWhatsApp } from "../../services/notification.js";

export class NotifierAgent extends Agent {
  async onMessage(message: any): Promise<void> {
    if (message.type === "notify:breach") {
      const { email, breaches } = message.payload;
      
      // Check user subscription status
      const user = await this.getUserByEmail(email);
      
      if (user && user.optedIn) {
        // Send notification via multiple channels
        await sendEmail(email, "重要: تم اكتشاف تسريب لبياناتك", this.formatMessage(breaches));
        if (user.telegramId) {
          await sendTelegram(user.telegramId, this.formatShortMessage(breaches));
        }
        if (user.whatsappNumber) {
          await sendWhatsApp(user.whatsappNumber, this.formatShortMessage(breaches));
        }
      } else if (!user) {
        // New user - offer free report
        await this.sendAcquisitionMessage(email, breaches.length);
      }
    }
  }

  private formatMessage(breaches: any[]): string {
    return `تم اكتشاف ${breaches.length} تسريب(ات) تتضمن بريدك الإلكتروني.\n\nالتسريبات:\n${breaches.map(b => `- ${b.name} (${b.date})`).join('\n')}\n\nللحصول على تقرير كامل وخطط الحماية: اضغط هنا [link to dashboard]`;
  }

  private formatShortMessage(breaches: any[]): string {
    return `🚨 إشعار أمني: ${breaches.length} تسريب(ات) جديدة تتضمن بريدك. اضغط للحصول على التقرير الكامل.`;
  }

  private async sendAcquisitionMessage(email: string, breachCount: number): Promise<void> {
    // Offer free report to acquire user
    await sendEmail(email, "[trial] تقرير مجاني عن التسريبات", `اكتشفنا ${breachCount} تسريبًا يتضمن بريدك. اضغط للحصول على التقرير المجاني.`);
  }

  private async getUserByEmail(email: string): Promise<any> {
    // TODO: Query database
    return null;
  }
}