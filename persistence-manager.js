#!/usr/bin/env node
/**
 * 🛡️ Persistence Manager - Fixed Version
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class PersistenceManager {
  constructor() {
    this.dataDir = path.join(__dirname, '.persistence-data');
    this.historyFile = path.join(this.dataDir, 'session-history.json');
    this.stateFile = path.join(this.dataDir, 'system-state.json');
    this.configFile = path.join(this.dataDir, 'persistence-config.json');
    this.backupDir = path.join(this.dataDir, 'backups');
    
    this.init();
  }

  init() {
    // Ensure directories
    [this.dataDir, this.backupDir].forEach(dir =u003e {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Load config
    if (fs.existsSync(this.configFile)) {
      this.config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
    } else {
      this.config = {
        autoSaveInterval: 60000, // 1 minute
        maxHistorySize: 100,
        backupInterval: 3600000, // 1 hour
        maxBackups: 10,
        autoRestart: true,
        restartThreshold: 30000, // 30 seconds
        lastRestart: null,
        apiRateLimit: false,
        rateLimitTime: null,
        rateLimitReset: null
      };
      this.saveConfig();
    }

    // Load state
    this.state = this.loadState();

    // Start monitoring
    this.startMonitoring();
  }

  saveConfig() {
    fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
  }

  loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } catch {
        return {
          lastActivity: null,
          lastCommand: null,
          activeTools: [],
          runningProcesses: [],
          lastError: null,
          uptime: 0,
          restartCount: 0,
          rateLimit: false
        };
      }
    }
    return {
      lastActivity: null,
      lastCommand: null,
      activeTools: [],
      runningProcesses: [],
      lastError: null,
      uptime: 0,
      restartCount: 0,
      rateLimit: false
    };
  }

  saveState() {
    this.state.lastActivity = new Date().toISOString();
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }

  addHistory(command, result, context = {}) {
    const history = {
      timestamp: new Date().toISOString(),
      command,
      result: result || 'success',
      context: {
        activeTools: this.state.activeTools,
        runningProcesses: this.state.runningProcesses,
        ...context
      }
    };

    // Read existing history
    let historyData = [];
    if (fs.existsSync(this.historyFile)) {
      try {
        historyData = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      } catch {}
    }

    // Add new entry
    historyData.push(history);

    // Keep only last N entries
    if (historyData.length > this.config.maxHistorySize) {
      historyData = historyData.slice(-this.config.maxHistorySize);
    }

    // Save
    fs.writeFileSync(this.historyFile, JSON.stringify(historyData, null, 2));
  }

  async monitorSystem() {
    // Check if OpenClaw is running
    try {
      const { stdout } = await execAsync('ps aux | grep openclaw | grep -v grep | wc -l');
      const running = parseInt(stdout.trim());

      if (running === 0) {
        console.log('⚠️  OpenClaw not running, restarting...');
        await this.restartOpenClaw();
      }
    } catch (error) {
      console.log('⚠️  Error checking OpenClaw status:', error.message);
    }

    // Check for stuck processes
    try {
      const { stdout } = await execAsync('ps aux | grep -E \'(node|npm|openclaw)\' | grep -v grep | head -20');
      const processes = stdout.split('\n').filter(p =u003e p.trim());

      this.state.runningProcesses = processes;
      this.saveState();
    } catch (error) {
      console.log('⚠️  Error checking processes:', error.message);
    }

    // Auto-save state
    this.saveState();
  }

  async restartOpenClaw() {
    try {
      console.log('🔄 Restarting OpenClaw...');

      // Stop any running processes
      await execAsync('pkill -f openclaw');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start OpenClaw
      await execAsync('openclaw gateway start');

      // Update state
      this.state.restartCount += 1;
      this.state.lastRestart = new Date().toISOString();
      this.saveState();

      console.log('✅ OpenClaw restarted');

      // Add to history
      this.addHistory('restart-openclaw', 'success', {
        restartCount: this.state.restartCount,
        lastRestart: this.state.lastRestart
      });

    } catch (error) {
      console.log('❌ Failed to restart OpenClaw:', error.message);
      this.state.lastError = error.message;
      this.saveState();
    }
  }

  startMonitoring() {
    // Monitor every minute
    this.monitorInterval = setInterval(() => {
      this.monitorSystem();
    }, this.config.autoSaveInterval);

    // Auto-backup every hour
    this.backupInterval = setInterval(() => {
      this.createBackup();
    }, this.config.backupInterval);

    console.log('🛡️  Persistence Manager active');
    console.log('   Auto-save: Every minute');
    console.log('   Auto-backup: Every hour');
    console.log('   Auto-restart: Enabled');
  }

  createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(this.backupDir, `backup-${timestamp}`);

      // Create backup
      fs.mkdirSync(backupDir, { recursive: true });

      // Copy important files
      const filesToBackup = [
        this.historyFile,
        this.stateFile,
        this.configFile
      ];

      filesToBackup.forEach(file =u003e {
        if (fs.existsSync(file)) {
          const dest = path.join(backupDir, path.basename(file));
          fs.copyFileSync(file, dest);
        }
      });

      // Keep only last N backups
      const allBackups = fs.readdirSync(this.backupDir)
        .filter(f =u003e f.startsWith('backup-'))
        .sort()
        .reverse();

      for (let i = this.config.maxBackups; i < allBackups.length; i++) {
        fs.rmdirSync(path.join(this.backupDir, allBackups[i]), { recursive: true });
      }

      console.log(`💾 Backup created: ${backupDir}`);

    } catch (error) {
      console.log('⚠️  Backup failed:', error.message);
    }
  }

  restoreLatestBackup() {
    try {
      const allBackups = fs.readdirSync(this.backupDir)
        .filter(f =u003e f.startsWith('backup-'))
        .sort()
        .reverse();

      if (allBackups.length === 0) {
        console.log('⚠️  No backups to restore');
        return;
      }

      const latestBackup = path.join(this.backupDir, allBackups[0]);
      console.log(`🔄 Restoring from backup: ${latestBackup}`);

      // Copy files back
      const filesToRestore = [
        this.historyFile,
        this.stateFile,
        this.configFile
      ];

      filesToRestore.forEach(file =u003e {
        const src = path.join(latestBackup, path.basename(file));
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, file);
        }
      });

      console.log('✅ Restore complete');

    } catch (error) {
      console.log('❌ Restore failed:', error.message);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      restartCount: this.state.restartCount,
      lastActivity: this.state.lastActivity,
      runningProcesses: this.state.runningProcesses,
      lastError: this.state.lastError,
      historySize: 0,
      backups: fs.readdirSync(this.backupDir).length
    };

    // Count history
    if (fs.existsSync(this.historyFile)) {
      const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
      report.historySize = history.length;
    }

    return report;
  }

  async showStatus() {
    const report = await this.generateReport();

    console.log(`\n🛡️  Persistence Manager Status`);
    console.log('═════════════════════════════');

    console.log(`\n🔵 Engine Status: ${this.isOpenClawRunning() ? '🟢 RUNNING' : '🔴 STOPPED'}`);
    if (this.state.lastRestart) {
      console.log(`   Last Restart: ${new Date(this.state.lastRestart).toLocaleString()}`);
      console.log(`   Restart Count: ${this.state.restartCount}`);
    }

    console.log(`\n📊 Statistics:`);
    console.log(`   Uptime: ${(process.uptime() / 3600).toFixed(2)} hours`);
    console.log(`   History Entries: ${report.historySize}`);
    console.log(`   Backups: ${report.backups}`);

    if (this.state.lastError) {
      console.log(`\n⚠️  Last Error: ${this.state.lastError.substring(0, 100)}...`);
    }

    console.log('\n✅ System is monitored and protected!');
  }

  isOpenClawRunning() {
    try {
      const { stdout } = execSync('ps aux | grep openclaw | grep -v grep | wc -l');
      return parseInt(stdout.trim()) > 0;
    } catch {
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new PersistenceManager();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Persistence Manager...');
    clearInterval(manager.monitorInterval);
    clearInterval(manager.backupInterval);
    await manager.saveState();
    console.log('✅ Shutdown complete');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down Persistence Manager...');
    clearInterval(manager.monitorInterval);
    clearInterval(manager.backupInterval);
    await manager.saveState();
    console.log('✅ Shutdown complete');
    process.exit(0);
  });

  // Show initial status
  manager.showStatus().catch(console.error);
}

module.exports = { PersistenceManager };
