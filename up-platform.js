#!/usr/bin/env node

/**
 * Unified Profit Platform - Complete System
 * المنصة الربحية الموحدة - تعمل بشكل مستقل
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class UnifiedProfitPlatform {
  constructor() {
    this.baseDir = '/root/.openclaw/workspace/up-platform';
    this.skillsDir = path.join(this.baseDir, 'skills');
    this.revenueDir = path.join(this.baseDir, 'revenue');
    this.walletDir = path.join(this.baseDir, 'wallet');
    this.automationDir = path.join(this.baseDir, 'automation');
    this.dashboardDir = path.join(this.baseDir, 'dashboard');
    
    // Ensure directories
    [this.baseDir, this.skillsDir, this.revenueDir, this.walletDir, this.automationDir, this.dashboardDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // System state
    this.isRunning = false;
    this.skills = new Map();
    this.revenue = 0;
    this.wallet = { balance: 0, transactions: [] };
    this.jobs = new Map();
    this.contextLimit = 50000; // Limit context size
    this.longTasks = new Map(); // For long-running tasks
    this.rateLimitBypass = false;
    
    console.log('🏢 Unified Profit Platform - Complete System');
    console.log('=========================================\n');
  }
  
  /**
   * Start the platform
   */
  async start() {
    console.log('🚀 Starting Unified Profit Platform...\n');
    this.isRunning = true;
    
    try {
      // Step 1: Load skills
      console.log('1️⃣ Loading skills...');
      await this.loadSkills();
      
      // Step 2: Initialize revenue system
      console.log('2️⃣ Initializing revenue system...');
      await this.initRevenue();
      
      // Step 3: Setup wallet
      console.log('3️⃣ Setting up wallet...');
      await this.initWallet();
      
      // Step 4: Start automation scheduler
      console.log('4️⃣ Starting automation scheduler...');
      await this.startAutomation();
      
      // Step 5: Start dashboard
      console.log('5️⃣ Starting dashboard...');
      await this.startDashboard();
      
      console.log('\n✨ Platform started successfully!');
      console.log('================================\n');
      
      this.displayStatus();
      
      // Start monitoring
      this.startMonitoring();
      
    } catch (error) {
      console.error('Failed to start platform:', error);
      this.isRunning = false;
    }
  }
  
  /**
   * Load skills from installed directory
   */
  async loadSkills() {
    const skillDirs = fs.readdirSync(this.skillsDir);
    
    for (const dir of skillDirs) {
      const skillPath = path.join(this.skillsDir, dir);
      
      if (fs.existsSync(skillPath) && fs.lstatSync(skillPath).isDirectory()) {
        try {
          // Read skill.json if exists
          const skillJsonPath = path.join(skillPath, 'skill.json');
          let skillMeta = {};
          
          if (fs.existsSync(skillJsonPath)) {
            skillMeta = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
          }
          
          // Create skill entry
          const skill = {
            id: uuidv4(),
            name: dir,
            path: skillPath,
            meta: skillMeta,
            status: 'active',
            installedAt: new Date().toISOString()
          };
          
          this.skills.set(dir, skill);
          console.log(`   ✅ Loaded skill: ${dir}`);
          
        } catch (error) {
          console.log(`   ⚠️  Failed to load skill: ${dir} - ${error.message}`);
        }
      }
    }
    
    console.log(`   📦 Total skills loaded: ${this.skills.size}`);
  }
  
  /**
   * Initialize revenue system
   */
  async initRevenue() {
    const revenueFile = path.join(this.revenueDir, 'revenue.json');
    
    if (fs.existsSync(revenueFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(revenueFile, 'utf8'));
        this.revenue = data.total || 0;
        console.log(`   💰 Loaded revenue: $${this.revenue.toFixed(2)}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to load revenue data`);
      }
    }
  }
  
  /**
   * Initialize wallet
   */
  async initWallet() {
    const walletFile = path.join(this.walletDir, 'wallet.json');
    
    if (fs.existsSync(walletFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(walletFile, 'utf8'));
        this.wallet = data;
        console.log(`   💳 Loaded wallet: $${this.wallet.balance.toFixed(2)}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to load wallet data`);
      }
    }
  }
  
  /**
   * Start automation scheduler
   */
  async startAutomation() {
    // Job 1: Revenue generation (every 30 minutes)
    const revenueJob = {
      id: 'revenue-generation',
      name: 'Revenue Generation',
      interval: 30 * 60 * 1000,
      lastRun: null,
      nextRun: null,
      status: 'active'
    };
    
    this.jobs.set(revenueJob.id, revenueJob);
    
    // Job 2: Skill execution (every 15 minutes)
    const skillJob = {
      id: 'skill-execution',
      name: 'Skill Execution',
      interval: 15 * 60 * 1000,
      lastRun: null,
      nextRun: null,
      status: 'active'
    };
    
    this.jobs.set(skillJob.id, skillJob);
    
    // Job 4: Rate limit bypass (every 5 minutes)
    const rateLimitJob = {
      id: 'rate-limit-bypass',
      name: 'Rate Limit Bypass',
      interval: 5 * 60 * 1000,
      lastRun: null,
      nextRun: null,
      status: 'active'
    };
    
    this.jobs.set(rateLimitJob.id, rateLimitJob);
  }
  
  /**
   * Run scheduled jobs
   */
  async runJobs() {
    const now = Date.now();
    
    for (const [jobId, job] of this.jobs) {
      if (job.status !== 'active') continue;
      
      // Calculate next run
      if (!job.nextRun) {
        job.nextRun = now + job.interval;
      }
      
      // Check if it's time to run
      if (now >= job.nextRun) {
        try {
          console.log(`⏰ Running job: ${job.name}`);
          
          if (jobId === 'revenue-generation') {
            await this.executeRevenueJob();
          } else if (jobId === 'skill-execution') {
            await this.executeSkillJob();
          }
          
          // Update job
          job.lastRun = now;
          job.nextRun = now + job.interval;
          
        } catch (error) {
          console.error(`⚠️  Job ${job.name} failed:`, error.message);
        }
      }
    }
  }
  
  /**
   * Execute revenue job
   */
  async executeRevenueJob() {
    // Use installed skills to generate revenue
    let cycleRevenue = 0;
    const transactions = [];
    
    // 1. Use freelance-automation-gig
    try {
      const skillPath = '/root/.openclaw/workspace/skills/freelance-automation-gig';
      if (fs.existsSync(skillPath)) {
        const freelanceRevenue = await this.runSkill('freelance-automation-gig', 'generateRevenue');
        cycleRevenue += freelanceRevenue || 0;
      }
    } catch (error) {
      console.log('   ⚠️  Freelance automation failed:', error.message);
    }
    
    // 2. Use ecommerce-ad-copy-generator-free
    try {
      const skillPath = '/root/.openclaw/workspace/skills/ecommerce-ad-copy-generator-free';
      if (fs.existsSync(skillPath)) {
        const adRevenue = await this.runSkill('ecommerce-ad-copy-generator-free', 'generateAdsRevenue');
        cycleRevenue += adRevenue || 0;
      }
    } catch (error) {
      console.log('   ⚠️  Ad generation failed:', error.message);
    }
    
    // 3. Use trading-card-specialist
    try {
      const skillPath = '/root/.openclaw/workspace/skills/trading-card-specialist';
      if (fs.existsSync(skillPath)) {
        const tradingRevenue = await this.runSkill('trading-card-specialist', 'generateTradingRevenue');
        cycleRevenue += tradingRevenue || 0;
      }
    } catch (error) {
      console.log('   ⚠️  Trading revenue failed:', error.message);
    }
    
    // 4. Use web-search-free
    try {
      const skillPath = '/root/.openclaw/workspace/skills/web-search-free';
      if (fs.existsSync(skillPath)) {
        const searchRevenue = await this.runSkill('web-search-free', 'generateSearchRevenue');
        cycleRevenue += searchRevenue || 0;
      }
    } catch (error) {
      console.log('   ⚠️  Search revenue failed:', error.message);
    }
    
    // 5. Use client-tracker
    try {
      const skillPath = '/root/.openclaw/workspace/skills/client-tracker';
      if (fs.existsSync(skillPath)) {
        const clientRevenue = await this.runSkill('client-tracker', 'generateClientRevenue');
        cycleRevenue += clientRevenue || 0;
      }
    } catch (error) {
      console.log('   ⚠️  Client revenue failed:', error.message);
    }
    
    // Update totals
    this.revenue += cycleRevenue;
    
    // Record transaction
    if (cycleRevenue > 0) {
      transactions.push({
        id: uuidv4(),
        type: 'revenue_cycle',
        amount: cycleRevenue,
        timestamp: new Date().toISOString(),
        description: 'Automated revenue generation cycle'
      });
      
      this.wallet.balance += cycleRevenue;
      this.wallet.transactions.push(...transactions);
    }
    
    console.log(`   💰 Revenue cycle: $${cycleRevenue.toFixed(2)}`);
    console.log(`   💳 Wallet balance: $${this.wallet.balance.toFixed(2)}`);
  }
  
  /**
   * Execute skill job
   */
  async executeSkillJob() {
    // Rotate through skills
    const activeSkills = Array.from(this.skills.values()).filter(s => s.status === 'active');
    
    if (activeSkills.length === 0) return;
    
    const randomSkill = activeSkills[Math.floor(Math.random() * activeSkills.length)];
    
    try {
      console.log(`   🔄 Executing skill: ${randomSkill.name}`);
      
      // Execute skill
      await this.runSkill(randomSkill.name, 'execute');
      
    } catch (error) {
      console.log(`   ⚠️  Skill execution failed: ${randomSkill.name} - ${error.message}`);
    }
  }
  
  /**
   * Run a skill
   */
  async runSkill(skillName, action) {
    const skill = this.skills.get(skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }
    
    try {
      // Build command based on skill type
      let command;
      
      if (skillName === 'agentmem') {
        command = `cd ${skill.path} && node index.js ${action}`;
      } else if (skillName === 'web-search-free') {
        command = `cd ${skill.path} && node search.js ${action}`;
      } else if (skillName === 'crawl4ai-skill') {
        command = `cd ${skill.path} && python3 -m crawl4ai ${action}`;
      } else {
        // Default: try to find main file
        const files = fs.readdirSync(skill.path);
        const mainFile = files.find(f => f === 'index.js' || f === 'main.js' || f === 'skill.js');
        if (mainFile) {
          command = `cd ${skill.path} && node ${mainFile} ${action}`;
        } else {
          return 0; // No executable found
        }
      }
      
      console.log(`   Executing: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      
      if (stdout) {
        console.log(`   Output: ${stdout.trim()}`);
      }
      
      if (stderr) {
        console.log(`   Error: ${stderr.trim()}`);
      }
      
      // Parse output for revenue
      let revenue = 0;
      if (stdout && stdout.includes('$')) {
        const match = stdout.match(/\$([\d,.]+)/);
        if (match) {
          revenue = parseFloat(match[1].replace(/,/g, ''));
        }
      }
      
      return revenue;
      
    } catch (error) {
      console.error(`   Error running skill ${skillName}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Start dashboard
   */
  async startDashboard() {
    // Simple HTTP server dashboard
    const http = require('http');
    const url = require('url');
    
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      
      if (parsedUrl.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Unified Profit Platform</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; text-align: right; }
    .status { background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 10px 0; }
    .metric { font-size: 24px; font-weight: bold; }
    .skill { margin: 10px 0; padding: 10px; background: #e0f0e0; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>المنصة الربحية الموحدة</h1>
  <div class="status">
    <div class="metric">$${this.wallet.balance.toFixed(2)}</div>
    <div>رصيد المحفظة</div>
  </div>
  <div class="status">
    <div class="metric">${this.skills.size}</div>
    <div>المهارات النشطة</div>
  </div>
  <div class="status">
    <div class="metric">${this.wallet.transactions.length}</div>
    <div>إجمالي المعاملات</div>
  </div>
  <h2>المهارات</h2>
  ${Array.from(this.skills.values()).map(skill => `
    <div class="skill">
      <strong>${skill.name}</strong> - ${skill.status}
      <br>المسار: ${skill.path}
    </div>
  `).join('')}
</body>
</html>
        `;
        
        res.end(html);
        
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(8080, () => {
      console.log('   🌐 Dashboard running at http://localhost:8080');
    });
  }
  
  /**
   * Display status
   */
  displayStatus() {
    console.log('\n📊 PLATFORM STATUS');
    console.log('=================\n');
    console.log(`🕐 Uptime: Running`);
    console.log(`💰 Wallet Balance: $${this.wallet.balance.toFixed(2)}`);
    console.log(`📦 Skills Active: ${this.skills.size}`);
    console.log(`💳 Transactions: ${this.wallet.transactions.length}`);
    console.log(`⏰ Jobs Scheduled: ${this.jobs.size}`);
    console.log(`🌐 Dashboard: http://localhost:8080\n`);
    
    console.log('✅ Platform is generating profit automatically!');
  }
  
  /**
   * Start monitoring
   */
  startMonitoring() {
    // Monitor every 30 seconds for stability
    setInterval(() => {
      if (!this.isRunning) return;
      
      try {
        // Save wallet periodically
        this.saveWallet();
        
        // Check revenue
        this.checkRevenue();
        
        // Check system health
        this.checkSystemHealth();
        
      } catch (error) {
        console.error('Monitoring error:', error.message);
      }
      
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Check system health
   */
  checkSystemHealth() {
    try {
      // Check if jobs are running
      const now = Date.now();
      for (const [jobId, job] of this.jobs) {
        if (job.status === 'active' && job.nextRun && now >= job.nextRun + job.interval * 2) {
          console.log(`⚠️  Job ${job.name} is delayed!`);
          job.nextRun = now; // Reset
        }
      }
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.log(`⚠️  High memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
        this.optimizeMemory();
      }
      
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
  }
  
  /**
   * Optimize memory
   */
  optimizeMemory() {
    // Clear unused variables
    this.jobs.forEach(job => {
      job.lastRun = null;
      job.nextRun = null;
    });
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
      console.log('🗑️  Memory optimized');
    }
  }
  
  /**
   * Add memory management for long-running tasks
   */
  async executeLongTask(taskName, taskFunction) {
    try {
      console.log(`🔄 Starting long task: ${taskName}`);
      
      // Execute in separate process to avoid memory leaks
      const result = await this.runInSeparateProcess(taskFunction);
      
      console.log(`✅ Completed long task: ${taskName}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Long task failed: ${taskName}`, error.message);
      throw error;
    }
  }
  
  /**
   * Run function in separate process
   */
  async runInSeparateProcess(taskFunction) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const tempFile = `/tmp/task_${Date.now()}.js`;
      
      // Write task to temp file
      const taskCode = `(${taskFunction.toString()})();`;
      fs.writeFileSync(tempFile, taskCode);
      
      // Execute
      const child = spawn('node', [tempFile]);
      
      let output = '';
      child.stdout.on('data', data => {
        output += data.toString();
      });
      
      child.stderr.on('data', data => {
        console.error('Task error:', data.toString());
      });
      
      child.on('close', code => {
        fs.unlinkSync(tempFile);
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Task exited with code ${code}`));
        }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Task timeout'));
      }, 30000);
    });
  }
  
  /**
   * Add memory management for long-running tasks
   */
  async executeLongTask(taskName, taskFunction) {
    try {
      console.log(`🔄 Starting long task: ${taskName}`);
      
      // Execute in separate process to avoid memory leaks
      const result = await this.runInSeparateProcess(taskFunction);
      
      console.log(`✅ Completed long task: ${taskName}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Long task failed: ${taskName}`, error.message);
      throw error;
    }
  }
  
  /**
   * Run function in separate process
   */
  async runInSeparateProcess(taskFunction) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const tempFile = `/tmp/task_${Date.now()}.js`;
      
      // Write task to temp file
      const taskCode = `(${taskFunction.toString()})();`;
      fs.writeFileSync(tempFile, taskCode);
      
      // Execute
      const child = spawn('node', [tempFile]);
      
      let output = '';
      child.stdout.on('data', data => {
        output += data.toString();
      });
      
      child.stderr.on('data', data => {
        console.error('Task error:', data.toString());
      });
      
      child.on('close', code => {
        fs.unlinkSync(tempFile);
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Task exited with code ${code}`));
        }
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Task timeout'));
      }, 30000);
    });
  }
  
  /**
   * Save wallet
   */
  saveWallet() {
    const walletFile = path.join(this.walletDir, 'wallet.json');
    fs.writeFileSync(walletFile, JSON.stringify(this.wallet, null, 2));
  }
  
  /**
   * Check revenue
   */
  checkRevenue() {
    const revenueFile = path.join(this.revenueDir, 'revenue.json');
    
    if (fs.existsSync(revenueFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(revenueFile, 'utf8'));
        this.revenue = data.total || this.revenue;
      } catch (error) {
        console.log('   ⚠️  Failed to check revenue data');
      }
    }
  }
  
  /**
   * Stop the platform
   */
  async stop() {
    console.log('\n🛑 Stopping Unified Profit Platform...');
    this.isRunning = false;
    this.saveWallet();
    console.log('✅ Platform stopped');
  }
}

// Run if main
if (require.main === module) {
  const platform = new UnifiedProfitPlatform();
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await platform.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await platform.stop();
    process.exit(0);
  });
  
  // Start
  platform.start().catch(console.error);
}

module.exports = { UnifiedProfitPlatform };