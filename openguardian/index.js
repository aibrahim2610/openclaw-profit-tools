#!/usr/bin/env node

import { MonitorAgent } from "./agents/monitor/agent.js";
import { NotifierAgent } from "./agents/notifier/agent.js";
import { UpsellerAgent } from "./agents/upseller/agent.js";
import { RemoverAgent } from "./agents/remover/agent.js";
import { initializeDatabase } from "./services/database.js";
import { PORT } from "./config.js";

async function main() {
  // Initialize database
  await initializeDatabase();
  
  // Create agents
  const monitorAgent = new MonitorAgent();
  const notifierAgent = new NotifierAgent();
  const upsellerAgent = new UpsellerAgent();
  const removerAgent = new RemoverAgent();
  
  // Start dashboard
  const dashboard = require("./dashboard/server.js");
  
  console.log("DataGuardian System Started!");
  console.log("Monitor Agent: Active");
  console.log("Notifier Agent: Active");
  console.log("Upseller Agent: Active");
  console.log("Remover Agent: Active");
  console.log("Dashboard: http://localhost:3000");
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
  });
}

main().catch(console.error);