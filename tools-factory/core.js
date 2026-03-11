#!/usr/bin/env node

/**
 * Tools Factory Core - Complete Implementation
 * المصنع الآلي للأدوات - النظام الكامل
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import all factory components
const ChromeExtensionFactory = require('./chrome-extension-factory');
const FourmProwler = require('./fourm-prowler');
const ByteRover = require('./byterover');
const FreeToolsLibrary = require('./free-tools-library');
const GuardianAI = require('./guardian-ai');

class ToolsFactoryCore {
  constructor() {
    this.outputDir = '/root/.openclaw/workspace/tools-factory';
    this.isRunning = false;
    
    // Components
    this.chromeFactory = null;
    this.prowler = null;
    this.byteRover = null;
    this.freeTools = null;
    this.guardian = null;
    
    // Stats
    this.stats = {
      startTime: null,
      toolsBuilt: 0,
      extensionsCreated: 0,
      opportunitiesFound: 0,
      profitsGenerated: 0,
      memoriesStored: 0
    };
    
    console.log('🏭 Tools Factory Core - Complete System');
    console.log('=======================================\n');
    
    this.initializeComponents();
  }
  
  initializeComponents() {
    console.log('🔧 Initializing components...\n');
    
    // 1. Chrome Extension Factory
    console.log('   🌐 Chrome Extension Factory');
    this.chromeFactory = new ChromeExtensionFactory();
    
    // 2. Fourm-Prowler
    console.log('   🎯 Fourm-Prowler (Opportunity Hunter)');
    this.prowler = new FourmProwler({
      targets: [
        'https://github.com',
        'https://stackoverflow.com',
        'https://reddit.com/r/freelance',
        'https://upwork.com',
        'https://fiverr.com'
      ],
      interval: 3600000, // 1 hour
      storagePath: path.join(this.outputDir, 'prowler-data')
    });
    
    // 3. ByteRover Memory System
    console.log('   🧠 ByteRover Memory System');
    this.byteRover = new ByteRover();
    
    // 4. Free Tools Library
    console.log('   📚 Free Tools Library');
    this.freeTools = new FreeToolsLibrary();
    
    // 5. Guardian-AI Integration
    console.log('   🛡️ Guardian-AI Integration');
    this.guardian = new GuardianAI();
    
    console.log('\n✅ All components initialized\n');
  }
  
  /**
   * Start the complete system
   */
  async start() {
    console.log('🚀 Starting Tools Factory Core System...\n');
    this.isRunning = true;
    this.stats.startTime = new Date();
    
    try {
      // Step 1: Start ByteRover memory
      console.log('1️⃣ Starting ByteRover Memory...');
      await this.byteRover.start();
      
      // Step 2: Start Fourm-Prowler
      console.log('2️⃣ Starting Fourm-Prowler...');
      this.prowler.start();
      
      // Step 3: Start Guardian-AI
      console.log('3️⃣ Starting Guardian-AI...');
      await this.guardian.start();
      
      // Step 4: Load free tools
      console.log('4️⃣ Loading Free Tools Library...');
      await this.freeTools.loadFromConfig();
      
      // Step 5: Create initial extensions
      console.log('5️⃣ Creating initial Chrome extensions...');
      await this.createInitialExtensions();
      
      // Step 6: Install essential tools
      console.log('6️⃣ Installing essential tools...');
      await this.installEssentialTools();
      
      console.log('\n✨ System started successfully!');
      console.log('================================\n');
      
      this.displayStatus();
      
      // Start stats monitoring
      this.startMonitoring();
      
    } catch (error) {
      console.error('Failed to start system:', error);
      this.isRunning = false;
    }
  }
  
  /**
   * Stop the complete system
   */
  async stop() {
    console.log('\n🛑 Stopping Tools Factory Core...');
    
    this.isRunning = false;
    
    if (this.prowler) {
      this.prowler.stop();
    }
    
    if (this.guardian) {
      await this.guardian.stop();
    }
    
    console.log('✅ System stopped');
  }
  
  /**
   * Create initial Chrome extensions
   */
  async createInitialExtensions() {
    const extensionsToCreate = [
      {
        name: 'FreeProfitTracker',
        description: 'Tracks profits and revenue automatically',
        permissions: ['storage', 'activeTab'],
        action: 'track_profit'
      },
      {
        name: 'AutoScraper',
        description: 'Automated web scraping tool',
        permissions: ['storage', 'activeTab', 'scripting'],
        action: 'scrape_page'
      },
      {
        name: 'MemorySearch',
        description: 'Search through your memory and history',
        permissions: ['storage'],
        action: 'search_memory'
      }
    ];
    
    for (const extConfig of extensionsToCreate) {
      try {
        const extension = await this.chromeFactory.createExtension(extConfig);
        this.stats.extensionsCreated++;
        console.log(`   ✅ Created extension: ${extension.name}`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${extConfig.name}: ${error.message}`);
      }
    }
  }
  
  /**
   * Install essential tools
   */
  async installEssentialTools() {
    // List of essential free tools from GitHub
    const essentialTools = [
      'https://github.com/D4Vinci/Scrapling.git',
      'https://github.com/browserless/chrome-remote-interface.git',
      'https://github.com/axios/axios.git',
      'https://github.com/cheeriojs/cheerio.git'
    ];
    
    for (const toolUrl of essentialTools) {
      try {
        const tool = await this.freeTools.installFromGitHub(toolUrl);
        this.stats.toolsBuilt++;
        console.log(`   ✅ Installed: ${tool.name}`);
      } catch (error) {
        console.log(`   ⚠️  Skipped: ${toolUrl.split('/')[4]} (${error.message})`);
      }
    }
  }
  
  /**
   * Display system status
   */
  displayStatus() {
    console.log('📊 SYSTEM STATUS');
    console.log('================\n');
    
    console.log(`🕐 Uptime: ${this.getUptime()}`);
    console.log(`🔧 Tools Built: ${this.stats.toolsBuilt}`);
    console.log(`🌐 Extensions Created: ${this.stats.extensionsCreated}`);
    console.log(`🎯 Opportunities Found: ${this.stats.opportunitiesFound}`);
    console.log(`💰 Profits Generated: $${this.stats.profitsGenerated.toFixed(2)}`);
    console.log(`💾 Memories Stored: ${this.stats.memoriesStored}`);
    console.log(`📁 Output Directory: ${this.outputDir}`);
    
    console.log('\n🎯 All systems operational!');
  }
  
  /**
   * Get uptime
   */
  getUptime() {
    if (!this.stats.startTime) return '0s';
    
    const now = new Date();
    const diff = now - this.stats.startTime;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  
  /**
   * Start monitoring loop
   */
  startMonitoring() {
    setInterval(() => {
      if (!this.isRunning) return;
      
      // Update stats from prowler
      if (this.prowler && this.prowler.profits) {
        const today = new Date().toISOString().split('T')[0];
        const todayProfit = this.prowler.profits.get(today) || 0;
        this.stats.profitsGenerated = todayProfit;
      }
      
      // Update memories count
      if (this.byteRover) {
        const memoryFiles = fs.readdirSync(path.join(this.byteRover.memoryDir))
          .filter(f => f.endsWith('.md')).length;
        this.stats.memoriesStored = memoryFiles;
      }
    }, 60000); // Every minute
  }
  
  /**
   * Get comprehensive report
   */
  getReport() {
    return {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      stats: this.stats,
      components: {
        chromeFactory: this.chromeFactory ? 'active' : 'inactive',
        prowler: this.prowler ? 'active' : 'inactive',
        byteRover: this.byteRover ? 'active' : 'inactive',
        freeTools: this.freeTools ? 'active' : 'inactive',
        guardian: this.guardian ? 'active' : 'inactive'
      }
    };
  }
}

// Main execution
if (require.main === module) {
  const factory = new ToolsFactoryCore();
  
  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down gracefully...');
    await factory.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n\n👋 Shutting down gracefully...');
    await factory.stop();
    process.exit(0);
  });
  
  // Start the system
  factory.start().catch(console.error);
}

module.exports = { ToolsFactoryCore };