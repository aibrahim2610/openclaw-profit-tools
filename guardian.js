#!/usr/bin/env node

/**
 * OpenClaw Guardian - منع الانقطاع
 * يراقب كل العمليات ويُعيد تشغيلها تلقائياً
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class OpenClawGuardian {
  constructor() {
    this.baseDir = '/root/.openclaw/workspace';
    this.guardianDir = path.join(this.baseDir, 'guardian');
    this.logDir = path.join(this.guardianDir, 'logs');
    this.stateDir = path.join(this.guardianDir, 'state');
    
    // Ensure directories
    [this.guardianDir, this.logDir, this.stateDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Processes to monitor
    this.processes = [
      { name: 'openclaw-gateway', cmd: 'openclaw gateway start', pid: null, restart: true },
      { name: 'guardian-ai', cmd: 'node guardian-ai-complete.js', pid: null, restart: true },
      { name: 'up-platform', cmd: 'node up-platform.js', pid: null, restart: true },
      { name: 'memory-monitor', cmd: 'node memory-health-monitor.js', pid: null, restart: true }
    ];
    
    this.stateFile = path.join(this.stateDir, 'guardian-state.json');
    this.logFile = path.join(this.logDir, 'guardian.log');
    
    this.isRunning = true;
    this.checkInterval = 30000; // Check every 30 seconds
    
    console.log('🛡️ OpenClaw Guardian - System Protection');
    console.log('======================================\n');
  }
  
  /**
   * Start guardian
   */
  async start() {
    console.log('🚀 Starting OpenClaw Guardian...\n');
    
    // Load state
    await this.loadState();
    
    // Start all processes
    await this.startAllProcesses();
    
    // Start monitoring loop
    this.monitorLoop();
    
    // Handle shutdown
    this.setupSignalHandlers();
    
    console.log('✅ Guardian is running!\n');
  }
  
  /**
   * Load state from file
   */
  async loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        this.processes.forEach((proc, idx) => {
          if (state.processes[idx]) {
            proc.pid = state.processes[idx].pid;
            proc.restart = state.processes[idx].restart;
          }
        });
        console.log('📂 Loaded guardian state');
      } catch (error) {
        console.log('⚠️  Failed to load state, starting fresh');
      }
    }
  }
  
  /**
   * Save state to file
   */
  async saveState() {
    const state = {
      processes: this.processes.map(p => ({
        name: p.name,
        pid: p.pid,
        restart: p.restart,
        lastCheck: Date.now()
      }))
    };
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }
  
  /**
   * Start all processes
   */
  async startAllProcesses() {
    console.log('1️⃣ Starting all processes...\n');
    
    for (const proc of this.processes) {
      await this.startProcess(proc);
    }
  }
  
  /**
   * Start a single process
   */
  async startProcess(proc) {
    try {
      // Check if already running
      if (proc.pid && await this.isProcessRunning(proc.pid)) {
        console.log(`   ✅ ${proc.name} already running (PID: ${proc.pid})`);
        return;
      }
      
      // Start new process
      console.log(`   🚀 Starting ${proc.name}...`);
      
      const child = exec(proc.cmd, {
        cwd: this.baseDir,
        detached: true,
        stdio: 'ignore'
      });
      
      proc.pid = child.pid;
      
      // Wait a bit for process to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify it's running
      if (await this.isProcessRunning(proc.pid)) {
        console.log(`   ✅ ${proc.name} started (PID: ${proc.pid})`);
        this.log(`STARTED: ${proc.name} (PID: ${proc.pid})`);
      } else {
        console.log(`   ❌ Failed to start ${proc.name}`);
        proc.pid = null;
        this.log(`FAILED: ${proc.name} failed to start`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error starting ${proc.name}: ${error.message}`);
      proc.pid = null;
      this.log(`ERROR: ${proc.name} - ${error.message}`);
    }
  }
  
  /**
   * Check if process is running
   */
  async isProcessRunning(pid) {
    try {
      const { stdout } = await execAsync(`ps -p ${pid} -o pid=`, { timeout: 5000 });
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Monitor loop
   */
  monitorLoop() {
    setInterval(async () => {
      try {
        await this.checkAllProcesses();
        await this.saveState();
      } catch (error) {
        this.log(`Monitor error: ${error.message}`);
      }
    }, this.checkInterval);
  }
  
  /**
   * Check all processes
   */
  async checkAllProcesses() {
    for (const proc of this.processes) {
      if (!proc.restart) continue;
      
      const isRunning = proc.pid && await this.isProcessRunning(proc.pid);
      
      if (!isRunning) {
        this.log(`RESTART: ${proc.name} (was PID: ${proc.pid})`);
        console.log(`⚠️  ${proc.name} stopped! Restarting...`);
        await this.startProcess(proc);
      }
    }
  }
  
  /**
   * Log message
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }
  
  /**
   * Setup signal handlers
   */
  setupSignalHandlers() {
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down guardian...');
      this.isRunning = false;
      await this.saveState();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down guardian...');
      this.isRunning = false;
      await this.saveState();
      process.exit(0);
    });
    
    process.on('uncaughtException', (error) => {
      this.log(`UNCAUGHT: ${error.message}\n${error.stack}`);
      console.error('Uncaught exception:', error);
    });
  }
}

// Run
if (require.main === module) {
  const guardian = new OpenClawGuardian();
  guardian.start().catch(console.error);
}

module.exports = { OpenClawGuardian };