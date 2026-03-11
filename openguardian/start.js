#!/usr/bin/env node

import { MonitorAgent } from "./agents/monitor/agent.js";
import { NotifierAgent } from "./agents/notifier/agent.js";
import { UpsellerAgent } from "./agents/upseller/agent.js";
import { RemoverAgent } from "./agents/remover/agent.js";
import { initializeDatabase } from "./services/database.js";
import { PORT } from "./config.js";

async function main() {
  console.log("🔥 DataGuardian System Starting...");
  
  // Initialize database
  try {
    await initializeDatabase();
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    process.exit(1);
  }
  
  // Create agents
  const monitorAgent = new MonitorAgent();
  const notifierAgent = new NotifierAgent();
  const upsellerAgent = new UpsellerAgent();
  const removerAgent = new RemoverAgent();
  
  console.log("✅ Agents created");
  console.log("👥 Monitor Agent: Active");
  console.log("📩 Notifier Agent: Active");
  console.log("💰 Upseller Agent: Active");
  console.log("🗑️ Remover Agent: Active");
  
  // Start dashboard
  const express = require("express");
  const path = require("path");
  const app = express();
  
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "dashboard/public")));
  
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "dashboard/public", "index.html"));
  });
  
  app.listen(PORT, () => {
    console.log(`🌐 Dashboard running on http://localhost:${PORT}`);
    console.log("🚀 DataGuardian System Ready!");
  });
  
  // Keep process alive
  process.on("SIGINT", () => {
    console.log("👋 Shutting down gracefully...");
    process.exit(0);
  });
}

main().catch(console.error);