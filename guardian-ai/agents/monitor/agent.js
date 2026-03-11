// Monitor Agent - JavaScript version
export class MonitorAgent {
  async onMessage(message) {
    if (message.type === "monitor:check") {
      const { email } = message.payload;
      const breaches = await this.hibpCheck(email);
      
      if (breaches.length > 0) {
        // Send to notifier agent
        this.gateway.sendMessage({
          type: "notify:breach",
          payload: { email, breaches }
        });
        
        // Store in database
        await this.storeBreach(email, breaches);
      }
    }
  }

  async storeBreach(email, breaches) {
    const db = require("../../services/database.js");
    await db.storeBreach(email, breaches);
    console.log(`Stored ${breaches.length} breaches for ${email}`);
  }

  async hibpCheck(email) {
    // Mock implementation - would call HIBP API
    return [];
  }
}