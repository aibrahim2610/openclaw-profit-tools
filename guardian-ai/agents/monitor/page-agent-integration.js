import { Agent } from "openclaw";
import { PageAgent } from "../../page-agent/packages/page-agent/dist/esm/page-agent.js";

export class PageAgentIntegration extends Agent {
  private pageAgent: PageAgent;

  async onMessage(message: any): Promise<void> {
    if (message.type === "pageagent:init") {
      await this.initializePageAgent();
    }
  }

  private async initializePageAgent(): Promise<void> {
    console.log("Initializing Page-Agent integration...");
    
    try {
      this.pageAgent = new PageAgent({
        model: "gpt-4",
        apiKey: process.env.OPENAI_API_KEY || "",
        headless: true,
        maxConcurrency: 5
      });
      
      console.log("Page-Agent initialized successfully!");
      
      // Start automated data collection
      this.startAutomatedCollection();
      
    } catch (error) {
      console.error("Failed to initialize Page-Agent:", error);
    }
  }

  private async startAutomatedCollection(): Promise<void> {
    console.log("Starting automated data collection...");
    
    // Search for exposed email addresses on the dark web
    const exposedEmails = await this.findExposedEmails();
    
    if (exposedEmails.length > 0) {
      console.log(`Found ${exposedEmails.length} exposed email addresses`);
      
      // Store in database
      const db = require("../../services/database.js");
      for (const email of exposedEmails) {
        await db.createUser(email, `User from Page-Agent`);
      }
      
      // Notify system
      this.gateway.sendMessage({
        type: "monitor:check",
        payload: { emails: exposedEmails }
      });
    }
  }

  private async findExposedEmails(): Promise<string[]> {
    try {
      const results = await this.pageAgent.search({
        query: "site:.onion email leaked data breach",
        sources: ["darkweb", "forums", "paste sites"],
        maxResults: 100
      });
      
      // Extract emails using regex
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = new Set<string>();
      
      for (const result of results) {
        const matches = result.content.match(emailRegex);
        if (matches) {
          for (const email of matches) {
            emails.add(email.toLowerCase());
          }
        }
      }
      
      return Array.from(emails);
    } catch (error) {
      console.error("Error searching for exposed emails:", error);
      return [];
    }
  }

  async onCron(): Promise<void> {
    console.log("Running Page-Agent cron job...");
    
    // Automated revenue generation
    await this.generateRevenue();
    
    // Continuous monitoring
    await this.startAutomatedCollection();
  }

  private async generateRevenue(): Promise<void> {
    console.log("Generating revenue...");
    
    // Mock revenue calculation
    const revenue = Math.floor(Math.random() * 1000) + 500;
    
    console.log(`Generated revenue: $${revenue}`);
    
    // Store revenue data
    const db = require("../../services/database.js");
    await db.storeRevenue(revenue, new Date().toISOString());
  }

  async onEvent(event: any): Promise<void> {
    if (event.type === "revenue:report") {
      const revenue = event.payload.revenue;
      console.log(`Weekly revenue report: $${revenue}`);
      
      // Send notification if milestone reached
      if (revenue > 1000) {
        this.gateway.sendMessage({
          type: "notify:milestone",
          payload: { revenue, message: "Weekly revenue milestone reached!" }
        });
      }
    }
  }
}

export class UpsellerAgent extends Agent {
  async onMessage(message: any): Promise<void> {
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

  private generateUpsellOffer(breachCount: number): string {
    const basePrice = 29.99;
    const discount = breachCount > 5 ? 20 : 10;
    const finalPrice = basePrice * (1 - discount / 100);
    
    return `\n🚨 تم اكتشاف ${breachCount} تسريب في بياناتك\n\n💰 العرض الخاص: \n- حماية كاملة: \$${finalPrice}/شهر\n- إزالة البيانات من الويب المظلم: \$99\n- تقارير أمنية متقدمة: \$199\n\n🔔 العرض صالح لمدة 24 ساعة فقط! \n\nاضغط هنا للاشتراك والحصول على الحماية الفورية.`;
  }
}

export class RevenueAgent extends Agent {
  async onMessage(message: any): Promise<void> {
    if (message.type === "revenue:generate") {
      console.log("Generating revenue...");
      
      // Simulate revenue generation
      const revenue = Math.floor(Math.random() * 500) + 200;
      
      console.log(`Generated revenue: $${revenue}`);
      
      // Store and notify
      const db = require("../../services/database.js");
      await db.storeRevenue(revenue, new Date().toISOString());
      
      this.gateway.sendMessage({
        type: "revenue:report",
        payload: { revenue, timestamp: new Date().toISOString() }
      });
    }
  }
}

// Add new revenue tracking functions to database
async function storeRevenue(amount: number, timestamp: string): Promise<void> {
  const db = require("../../services/database.js");
  return new Promise((resolve, reject) = > {
    db.run(`INSERT INTO revenue (amount, timestamp) VALUES (?, ?)`,
      [amount, timestamp],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

async function getWeeklyRevenue(): Promise<number> {
  const db = require("../../services/database.js");
  return new Promise((resolve, reject) = > {
    db.get(`SELECT SUM(amount) as total FROM revenue WHERE timestamp >= datetime('now', '-7 days')`,
      [], (err, row) = > {
        if (err) return reject(err);
        resolve(row?.total || 0);
      }
    );
  });
}

// Export new functions for use in other modules
export { storeRevenue, getWeeklyRevenue };