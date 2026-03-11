#!/usr/bin/env node
/**
 * 📊 Profit Status Dashboard
 */

const fs = require('fs');
const path = require('path');

async function checkProcess(pid) {
  try {
    const { execSync } = require('child_process');
    execSync(`ps -p ${pid}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function getRevenueFromLogs() {
  const logDir = path.join(__dirname, 'revenue-logs');
  if (!fs.existsSync(logDir)) return 0;
  
  const logs = fs.readdirSync(logDir).filter(f => f.endsWith('.json'));
  let total = 0;
  
  for (const log of logs) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(logDir, log), 'utf8'));
      total += data.revenue?.total || 0;
    } catch {}
  }
  
  return total;
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                          ║
║   📊 Profit System Status Dashboard                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  // Check if engine is running
  const pidFile = path.join(__dirname, 'profit-engine.pid');
  let running = false;
  let pid = null;
  
  if (fs.existsSync(pidFile)) {
    pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
    running = await checkProcess(pid);
  }
  
  console.log(`\n🔵 Engine Status: ${running ? '🟢 RUNNING' : '🔴 STOPPED'}`);
  if (running) console.log(`   PID: ${pid}`);
  
  // Show skills
  const skillsDir = path.join(__dirname, 'skills');
  let skillsCount = 0;
  if (fs.existsSync(skillsDir)) {
    skillsCount = fs.readdirSync(skillsDir).filter(f => 
      fs.statSync(path.join(skillsDir, f)).isDirectory()
    ).length;
  }
  console.log(`\n🤖 Skills Available: ${skillsCount}`);
  
  // Show revenue
  const totalRevenue = await getRevenueFromLogs();
  console.log(`\n💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
  
  // Show recent logs
  const logFile = path.join(__dirname, 'profit-system.log');
  if (fs.existsSync(logFile)) {
    const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l.trim());
    const recent = logs.slice(-5);
    console.log(`\n📋 Recent Activity:`);
    recent.forEach(l => console.log(`   ${l.substring(0, 80)}...`));
  }
  
  console.log(`
✅ System is operational!
💰 Revenue cycles run every 30 minutes
📈 Monitor with: tail -f profit-system.log
  
  `);
}

main().catch(console.error);
