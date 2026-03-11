#!/usr/bin/env node

const { MonitorAgent } = require("./agents/monitor/agent.js");
const { NotifierAgent } = require("./agents/notifier/agent.js");
const { UpsellerAgent } = require("./agents/upseller/agent.js");
const { RemoverAgent } = require("./agents/remover/agent.js");
const { initializeDatabase } = require("./services/database.js");
const { startCronJobs } = require("./services/cron.js");

async function main() {
  console.log("\n🚀Launching DataGuardian -Automated Profit System...\n");
  
  console.log("🗄️  Initializing database...");
  await initializeDatabase();
  
  console.log("🤖 Creating AI agents...");
  const monitorAgent = new MonitorAgent();
  const notifierAgent = new NotifierAgent();
  const upsellerAgent = new UpsellerAgent();
  const removerAgent = new RemoverAgent();
  
  console.log("📅 Starting automated cron jobs...");
  startCronJobs();
  
  console.log("\n✅ DataGuardian System Started!\n");
  console.log("📊 Monitor Agent: Active");
  console.log("📢 Notifier Agent: Active");
  console.log("🏆 Upseller Agent: Active");
  console.log("🔧 Remover Agent: Active");
  console.log("⏰ Cron Jobs: Running every hour");
  console.log("💰 Revenue Tracking: Automated");
  console.log("🚀 Profit Generation: Active\n");
  
  console.log("Dashboard will be available at http://localhost:3000\n");
  
  // Keep process alive
  setInterval(() => {}, 1000);
}

main().catch(function(error) {
  console.error("Fatal error:", error);
  process.exit(1);
});