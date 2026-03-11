#!/usr/bin/env node

/**
 * Profit Agent - Ang花椒لعنت ment Autopilot
 * عامل ربح ذاتي التشغيل - لا يحتاج تدخل بشري
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const http = require('http');
const https = require('https');

class ProfitAgent {
  constructor() {
    this.baseDir = '/root/.openclaw/workspace/profit-agent';
    this.dataDir = path.join(this.baseDir, 'data');
    this.logsDir = path.join(this.baseDir, 'logs');
    this.backupDir = path.join(this.baseDir, 'backups');
    this.pidsDir = path.join(this.baseDir, 'pids');
    
    // Ensure directories
    [this.baseDir, this.dataDir, this.logsDir, this.backupDir, this.pidsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // State
    this.isRunning = false;
    this.agents = new Map();
    this.revenue = 0;
    this.wallet = { balance: 0, transactions: [] };
    this.tasks = new Map();
    this.sessionHistory = [];
    
    // Constants
    this.MAX_CONCURRENT_AGENTS = 10;
    this.AGENT_TIMEOUT = 300000; // 5 minutes
    this.RETRY_ATTEMPTS = 3;
    this.BACKUP_INTERVAL = 3600000; // 1 hour
    
    console.log('🤖 Profit Agent - Ang花椒لعنت ment Autopilot');
    console.log('============================================\n');
  }
  
  /**
   * Start the agent
   */
  async start() {
    console.log('🚀 Starting Profit Agent...\n');
    this.isRunning = true;
    
    try {
      // Step 1: Load state
      await this.loadState();
      
      // Step 2: Initialize agents
      await this.initAgents();
      
      // Step 3: Start backup scheduler
      this.startBackupScheduler();
      
      // Step 4: Start monitoring
      this.startMonitoring();
      
      // Step 5: Launch revenue tasks
      await this.launchRevenueTasks();
      
      console.log('\n✅ Profit Agent started successfully!');
      console.log('====================================\n');
      
      this.displayStatus();
      
      // Keep running
      this.keepRunning();
      
    } catch (error) {
      console.error('❌ Failed to start agent:', error);
      this.isRunning = false;
    }
  }
  
  /**
   * Load saved state
   */
  async loadState() {
    const stateFile = path.join(this.dataDir, 'state.json');
    
    if (fs.existsSync(stateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.revenue = state.revenue || 0;
        this.wallet = state.wallet || { balance: 0, transactions: [] };
        this.sessionHistory = state.sessionHistory || [];
        console.log('📂 Loaded saved state');
      } catch (error) {
        console.log('⚠️  Failed to load state, starting fresh');
      }
    }
  }
  
  /**
   * Save state
   */
  async saveState() {
    const stateFile = path.join(this.dataDir, 'state.json');
    const state = {
      revenue: this.revenue,
      wallet: this.wallet,
      sessionHistory: this.sessionHistory,
      lastSave: new Date().toISOString()
    };
    
    try {
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('⚠️  Failed to save state:', error.message);
    }
  }
  
  /**
   * Initialize agents from skills
   */
  async initAgents() {
    const skillsDir = '/root/.openclaw/workspace/skills';
    const agentSkills = [
      'freelance-automation-gig',
      'ecommerce-ad-copy-generator-free',
      'trading-card-specialist',
      'web-search-free',
      'client-tracker',
      'crawl4ai-skill',
      'agentmem'
    ];
    
    for (const skillName of agentSkills) {
      const skillPath = path.join(skillsDir, skillName);
      
      if (fs.existsSync(skillPath)) {
        const agent = {
          id: uuidv4(),
          name: skillName,
          path: skillPath,
          status: 'idle',
          lastRun: null,
          runCount: 0,
          totalRevenue: 0,
          errors: 0,
          pid: null
        };
        
        this.agents.set(skillName, agent);
        console.log(`   🤖 Agent initialized: ${skillName}`);
      }
    }
    
    console.log(`   📊 Total agents: ${this.agents.size}`);
  }
  
  /**
   * Start backup scheduler
   */
  startBackupScheduler() {
    setInterval(() => {
      this.createBackup();
    }, this.BACKUP_INTERVAL);
    
    console.log('   💾 Backup scheduler active');
  }
  
  /**
   * Create backup
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
    
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        revenue: this.revenue,
        wallet: this.wallet,
        agents: Array.from(this.agents.values()),
        sessionHistory: this.sessionHistory.slice(-1000) // Last 1000 entries
      };
      
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      console.log(`   💾 Backup created: ${backupFile}`);
    } catch (error) {
      console.error('   ⚠️  Backup failed:', error.message);
    }
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.monitorSystem();
    }, 30000);
    
    console.log('   👁️  System monitoring active');
  }
  
  /**
   * Monitor system health
   */
  async monitorSystem() {
    // Check agents
    for (const [name, agent] of this.agents) {
      if (agent.status === 'running') {
        // Check if agent is still alive
        try {
          if (agent.pid) {
            const { stdout } = await execAsync(`ps -p ${agent.pid}`, { timeout: 5000 });
            if (!stdout.includes(agent.pid.toString())) {
              // Process died
              console.log(`   ⚠️  Agent ${name} (PID ${agent.pid}) died, restarting...`);
              agent.status = 'idle';
              agent.pid = null;
              agent.errors += 1;
            }
          }
        } catch (error) {
          // Process not found
          agent.status = 'idle';
          agent.pid = null;
        }
      }
    }
    
    // Save state periodically
    await this.saveState();
  }
  
  /**
   * Launch revenue tasks
   */
  async launchRevenueTasks() {
    console.log('   💰 Launching revenue tasks...');
    
    // Launch all agents in parallel
    for (const [name, agent] of this.agents) {
      if (agent.status === 'idle') {
        setTimeout(() => {
          this.runAgent(agent);
        }, Math.random() * 30000); // Random delay to avoid thundering herd
      }
    }
  }
  
  /**
   * Run an agent
   */
  async runAgent(agent) {
    if (agent.status === 'running') return;
    
    // Check concurrent limit
    const runningCount = Array.from(this.agents.values()).filter(a => a.status === 'running').length;
    if (runningCount >= this.MAX_CONCURRENT_AGENTS) {
      console.log(`   ⏳ Queueing agent ${agent.name} (max concurrent reached)`);
      setTimeout(() => this.runAgent(agent), 60000);
      return;
    }
    
    agent.status = 'running';
    agent.lastRun = new Date();
    
    try {
      // Build command with bypass options
      let command;
      
      if (agent.name === 'freelance-automation-gig') {
        command = `cd ${agent.path} && timeout ${this.AGENT_TIMEOUT} node index.js generateRevenue`;
      } else if (agent.name === 'ecommerce-ad-copy-generator-free') {
        command = `cd ${agent.path} && timeout ${this.AGENT_TIMEOUT} node index.js generateAds`;
      } else if (agent.name === 'trading-card-specialist') {
        command = `cd ${agent.path} && timeout ${this.AGENT_TIMEOUT} node index.js analyzeMarket`;
      } else if (agent.name === 'web-search-free') {
        command = `cd ${agent.path} && timeout ${this.AGENT_TIMEOUT} node search.js auto`;
      } else if (agent.name === 'client-tracker') {
        command = `cd ${agent.path} && timeout ${this.AGENT_TIMEOUT} node index.js track`;
      } else if (agent.name === 'crawl4ai-skill') {
        command = `cd ${agent.path} && timeout ${this.AGENT_TIMEOUT} python3 -m crawl4ai crawl`;
      } else {
        command = `cd ${agent.path} && timeout ${this.AGENT_TIMEOUT} node index.js execute`;
      }
      
      console.log(`   🏃 Running agent: ${agent.name}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.AGENT_TIMEOUT + 10000,
        maxBuffer: 1024 * 1024 // 1MB
      });
      
      // Parse revenue from output
      let revenue = 0;
      if (stdout) {
        // Look for dollar amounts
        const matches = stdout.match(/\$([\d,]+\.?\d*)/g);
        if (matches) {
          revenue = matches.reduce((sum, m) => sum + parseFloat(m.replace(/,/g, '')), 0);
        }
        
        console.log(`   📊 Agent ${agent.name} output: ${stdout.trim().substring(0, 100)}...`);
      }
      
      if (stderr && !stderr.includes('timeout')) {
        console.log(`   ⚠️  Agent ${agent.name} stderr: ${stderr.trim().substring(0, 100)}...`);
      }
      
      // Update stats
      agent.runCount += 1;
      agent.totalRevenue += revenue;
      agent.status = 'idle';
      agent.pid = null;
      
      // Update totals
      this.revenue += revenue;
      this.wallet.balance += revenue;
      
      // Record transaction
      this.wallet.transactions.push({
        id: uuidv4(),
        type: 'agent_revenue',
        agent: agent.name,
        amount: revenue,
        timestamp: new Date().toISOString(),
        description: `Revenue from ${agent.name}`
      });
      
      console.log(`   💰 ${agent.name} generated: $${revenue.toFixed(2)}`);
      console.log(`   💳 Total balance: $${this.wallet.balance.toFixed(2)}`);
      
      // Schedule next run
      this.scheduleAgent(agent);
      
    } catch (error) {
      agent.errors += 1;
      agent.status = 'idle';
      agent.pid = null;
      
      console.error(`   ❌ Agent ${agent.name} failed:`, error.message);
      
      // Retry after delay
      setTimeout(() => this.runAgent(agent), 300000); // 5 minutes
    }
  }
  
  /**
   * Schedule agent for next run
   */
  scheduleAgent(agent) {
    const delays = [900000, 1200000, 1800000, 2700000, 3600000]; // 15min to 1hour
    const delay = delays[Math.floor(Math.random() * delays.length)];
    
    setTimeout(() => {
      if (this.isRunning) {
        this.runAgent(agent);
      }
    }, delay);
  }
  
  /**
   * Keep running
   */
  keepRunning() {
    // Prevent exit
    setInterval(() => {
      // Just a heartbeat
    }, 60000);
  }
  
  /**
   * Display status
   */
  displayStatus() {
    console.log('\n📊 AGENT STATUS');
    console.log('===============\n');
    console.log(`🕐 Uptime: Running`);
    console.log(`💰 Total Revenue: $${this.revenue.toFixed(2)}`);
    console.log(`💳 Wallet Balance: $${this.wallet.balance.toFixed(2)}`);
    console.log(`📦 Agents Active: ${this.agents.size}`);
    console.log(`💳 Transactions: ${this.wallet.transactions.length}\n`);
    
    console.log('🤖 Agent Details:');
    console.log('-----------------');
    for (const [name, agent] of this.agents) {
      const statusIcon = agent.status === 'running' ? '🟢' : '⚪';
      console.log(`${statusIcon} ${name.padEnd(35)} Runs: ${agent.runCount.toString().padStart(4)} | Revenue: $${agent.totalRevenue.toFixed(2).padStart(8)} | Errors: ${agent.errors}`);
    }
    
    console.log('\n✅ System is operating autonomously!');
    console.log('=====================================\n');
  }
}

// Run if main
if (require.main === module) {
  const agent = new ProfitAgent();
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await agent.saveState();
    console.log('✅ Shutdown complete');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await agent.saveState();
    console.log('✅ Shutdown complete');
    process.exit(0);
  });
  
  // Start
  agent.start().catch(console.error);
}

module.exports = { ProfitAgent };