import { Agent } from "openclaw";
import { getBreaches } from "../../services/hibp.js";
import { getUserByEmail } from "../../services/database.js";

export class UpsellerAgent extends Agent {
  async onMessage(message: any): Promise<void> {
    if (message.type === "notify:breach") {
      const { email, breaches } = message.payload;
      
      // Get user info
      const user = await getUserByEmail(email);
      if (!user || user.subscriptionLevel === "free") {
        // User is free or new - offer premium
        const premiumOffer = this.createPremiumOffer(breaches.length);
        
        // Send upsell message
        await this.sendUpsellMessage(email, premiumOffer);
        
        // Track conversion
        this.trackUpsellAttempt(email, breaches.length);
      }
    }
  }

  private createPremiumOffer(breachCount: number): any {
    const severity = this.getBreachSeverity(breachCount);
    const price = this.getPremiumPrice(severity);
    const features = this.getPremiumFeatures(severity);
    
    return {
      title: `خطة حماية ${severity} - ${price}/شهر`,
      features,
      price,
      callToAction: `اشترك الآن لحماية بياناتك من ${breachCount} تسريب(ات)`
    };
  }

  private getBreachSeverity(count: number): string {
    if (count > 5) return "عالية";
    if (count > 2) return "متوسطة";
    return "أساسية";
  }

  private getPremiumPrice(severity: string): string {
    const prices = {
      "عالية": "$29.99/شهر",
      "متوسطة": "$14.99/شهر",
      "أساسية": "$4.99/شهر"
    };
    return prices[severity];
  }

  private getPremiumFeatures(severity: string): string[] {
    const baseFeatures = [
      "مراقبة مستمرة 24/7",
      "إشعارات فورية",
      "تقارير مفصلة"
    ];
    
    const severityFeatures = {
      "عالية": ["إزالة من 50+ موقع تتبع", "دعم مباشر 24/7", "تأمين الهوية"],
      "متوسطة": ["إزالة من 20+ موقع تتبع", "دعم عبر البريد"],
      "أساسية": ["إزالة من 5+ مواقع تتبع", "دعم ذاتي"]
    };
    
    return [...baseFeatures, ...severityFeatures[severity]];
  }

  private async sendUpsellMessage(email: string, offer: any): Promise<void> {
    const message = `🚨 تم اكتشاف ${offer.breachCount} تسريب(ات) تتضمن بريدك.\n\n${offer.title}\n\nالمميزات:\n${offer.features.map(f = > `- ${f}`).join('\n')}\n\n${offer.callToAction}\n\nاضغط هنا للاشتراك: [link]`;
    
    await sendEmail(email, "عرض خاص لحماية بياناتك", message);
  }

  private trackUpsellAttempt(email: string, breachCount: number): void {
    console.log(`Upsell attempt for ${email} with ${breachCount} breaches`);
  }
}