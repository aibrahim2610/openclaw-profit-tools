
  async loadResellerSystem() {
    console.log(`   🛒 Loading OpenRouter Reseller System...`);
    try {
      const { exec } = require('child_process');
      await execAsync(`node /root/.openclaw/workspace/reseller-system/index.js &`);
      console.log(`   ✅ Reseller System started on port 3001`);
    } catch (error) {
      console.log(`   ⚠️  Reseller System not available: ${error.message}`);
    }
  }

  async startProduction() {
    console.log(`\n🚀 Guardian-AI Complete Production Launcher - ${new Date().toLocaleString()}`);
    
    // 1. Setup SSL
    await this.setupSSL();

    // 2. Configure Stripe
    await this.setupStripe();

    // 3. Start services
    await this.startServices();

    // 4. Load additional systems
    await this.loadResellerSystem();

    // 5. Final verification
    await this.finalVerification();
  }