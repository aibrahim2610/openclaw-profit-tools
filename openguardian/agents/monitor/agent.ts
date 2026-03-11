import { Agent } from "openclaw";
import { hibpCheck } from "../../services/hibp.js";

export class MonitorAgent extends Agent {
  async onMessage(message: any): Promise<void> {
    if (message.type === "monitor:check") {
      const { email } = message.payload;
      const breaches = await hibpCheck(email);
      
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

  private async storeBreach(email: string, breaches: any[]): Promise<void> {
    // TODO: Store in SQLite encrypted
    console.log(`Stored ${breaches.length} breaches for ${email}`);
  }
}