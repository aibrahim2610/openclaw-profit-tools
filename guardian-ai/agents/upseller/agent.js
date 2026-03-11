// Upseller Agent - JavaScript version
export class UpsellerAgent {
  async onMessage(message) {
    if (message.type === "upsell:offer") {
      const { email, breaches } = message.payload;
      console.log(`Upselling to ${email}...`);
      
      // Generate upsell offer
      const offer = this.generateUpsellOffer(breaches.length);
      
      // Send offer
      this.gateway.sendMessage({
        type: "notify:upsell",
        payload: { email, offer }
      });
    }
  }

  generateUpsellOffer(breachCount) {
    const basePrice = 29.99;
    const discount = breachCount > 5 ? 20 : 10;
    const finalPrice = basePrice * (1 - discount / 100);
    
    return `\n🚨 تم اكتشاف ${breachCount} تسريب في بياناتك\n\n💰 العرض الخاص: \n- حماية كاملة: \$${finalPrice}/شهر\n- إزالة البيانات من الويب المظلم: \$99\n- تقارير أمنية متقدمة: \$199\n\n🔔 العرض صالح لمدة 24 ساعة فقط! \n\nاضغط هنا للاشتراك والحصول على الحماية الفورية.`;
  }
}