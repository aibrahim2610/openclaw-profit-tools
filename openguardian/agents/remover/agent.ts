import { Agent } from "openclaw";
import { submitRemovalRequests } from "../../services/removal.js";
import { getUserByEmail } from "../../services/database.js";

export class RemoverAgent extends Agent {
  async onMessage(message: any): Promise<void> {
    if (message.type === "removal:request") {
      const { email, userId } = message.payload;
      
      // Check if user has premium subscription
      const user = await getUserByEmail(email);
      if (user && user.subscriptionLevel !== "free") {
        // Submit removal requests to data brokers
        const results = await submitRemovalRequests(email, user.name);
        
        // Track progress
        await this.trackRemovalProgress(userId, results);
        
        // Notify user of results
        await this.sendRemovalReport(email, results);
      } else {
        // Prompt to upgrade
        await this.sendUpgradePrompt(email);
      }
    }
  }

  private async trackRemovalProgress(userId: string, results: any[]): Promise<void> {
    const completed = results.filter(r => r.status === "completed").length;
    const pending = results.filter(r => r.status === "pending").length;
    const failed = results.filter(r => r.status === "failed").length;
    
    console.log(`Removal progress for ${userId}: ${completed} completed, ${pending} pending, ${failed} failed`);
    
    // Store in database
    // await db.insert('removal_progress', { userId, results, timestamp: new Date() });
  }

  private async sendRemovalReport(email: string, results: any[]): Promise<void> {
    const completed = results.filter(r => r.status === "completed").length;
    const pending = results.filter(r => r.status === "pending").length;
    
    const report = `تقرير إزالة البيانات:\n\n✅ مكتمل: ${completed}موقع\n⏳ قيد المعالجة: ${pending} موقع\n\nسنوفر لك تحديثات منتظمة. شكرًا لاستخدامك خدمة الحماية.`;
    
    await sendEmail(email, "تقرير إزالة البيانات", report);
  }

  private async sendUpgradePrompt(email: string): Promise<void> {
    const message = `للإشتراك في خدمة الإزالة الممتازة (تتضمن إزالة من 50+ موقع تتبع)، يرجى الترقية إلى الخطة المميزة.\n\nاضغط هنا للتحديث: [link]`;
    await sendEmail(email, "ترقية مطلوبة للإزالة", message);
  }
}