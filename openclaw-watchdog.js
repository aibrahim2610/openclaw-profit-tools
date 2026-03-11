#!/usr/bin/env node

/**
 * OpenClaw Watchdog & Auto-Recovery System
 * يراقب OpenClaw ويعيد تشغيله تلقائياً عند مشاكل الـ timeout
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class OpenClawWatchdog {
  constructor() {
    this.gatewayProcess = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartWindow = 600000; // 10 minutes
    this.restartTimestamps = [];
    this.isShuttingDown = false;
    
    this.logFile = '/root/.openclaw/workspace/logs/watchdog.log';
    this.ensureLogDir();
    
    this.monitorInterval = null;
    this.timeoutThreshold = 45000; // 45 seconds
    this.requestHistory = [];
    this.maxHistorySize = 100;
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
    console.log(logEntry.trim());
  }

  start() {
    this.log('🚀 Starting OpenClaw Watchdog...');
    
    // Start initial check
    this.checkAndStart();
    
    // Set up intervals
    this.monitorInterval = setInterval(() => this.checkAndStart(), 10000); // Every 10 seconds
    this.healthInterval = setInterval(() => this.performHealthCheck(), 60000); // Every minute
    
    // Handle shutdown
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGUSR2', () => this.restartNow('Manual restart requested'));
    
    this.log('✅ Watchdog started. Monitoring OpenClaw gateway...');
  }

  checkAndStart() {
    if (this.isShuttingDown) return;
    
    // Check if gateway is running
    const isRunning = this.isGatewayRunning();
    
    if (!isRunning) {
      this.log('❌ OpenClaw gateway is not running', 'WARN');
      this.restartGateway('Gateway not running');
    } else {
      // Check if it's responsive
      const responsive = this.checkGatewayResponsiveness();
      if (!responsive) {
        this.log('⚠️  Gateway is running but not responsive', 'WARN');
        this.restartGateway('Gateway unresponsive');
      }
    }
  }

  isGatewayRunning() {
    try {
      const result = spawn.sync('pgrep', ['-f', 'openclaw gateway']);
      return result.stdout.toString().trim().split('\n').filter(p => p).length > 0;
    } catch (error) {
      return false;
    }
  }

  checkGatewayResponsiveness() {
    try {
      // Try to query gateway status via API
      const result = spawn.sync('curl', [
        '-s', '-o', '/dev/null',
        '-w', '%{http_code}',
        'http://localhost:18789/health'
      ], { timeout: 5000 });
      
      const statusCode = result.stdout.toString().trim();
      return statusCode === '200' || statusCode === '204';
    } catch (error) {
      return false;
    }
  }

  shouldThrottleRestart() {
    const now = Date.now();
    const windowStart = now - this.restartWindow;
    
    // Remove old timestamps
    this.restartTimestamps = this.restartTimestamps.filter(t => t > windowStart);
    
    // Check if we're exceeding restart limit
    if (this.restartTimestamps.length >= this.maxRestarts) {
      this.log('🚨 Too many restarts in window! Cooling down...', 'ERROR');
      return true;
    }
    
    return false;
  }

  restartGateway(reason) {
    if (this.shouldThrottleRestart()) {
      this.log('⏳ Restart throttled - waiting for window to clear', 'WARN');
      return;
    }
    
    this.restartCount++;
    this.restartTimestamps.push(Date.now());
    
    this.log(`🔄 Restarting OpenClaw gateway (#${this.restartCount}) - Reason: ${reason}`);
    
    try {
      // Graceful shutdown first
      this.log('  → Sending SIGTERM to gateway...');
      spawn.sync('pkill', ['-SIGTERM', '-f', 'openclaw gateway']);
      
      // Wait for shutdown
      this.delay(3000);
      
      // Force kill if still running
      if (this.isGatewayRunning()) {
        this.log('  → Force killing gateway (SIGKILL)...');
        spawn.sync('pkill', ['-SIGKILL', '-f', 'openclaw gateway']);
        this.delay(2000);
      }
      
      // Start fresh
      this.log('  → Starting gateway...');
      this.gatewayProcess = spawn('openclaw', ['gateway', 'start'], {
        detached: true,
        stdio: 'ignore'
      });
      
      this.log('✅ Gateway restarted successfully');
      
      // Wait for startup
      this.delay(5000);
      
      // Verify it's running
      if (this.isGatewayRunning() && this.checkGatewayResponsiveness()) {
        this.log('✅ Gateway is healthy after restart');
      } else {
        this.log('❌ Gateway failed to become healthy after restart', 'ERROR');
      }
      
    } catch (error) {
      this.log(`❌ Error during restart: ${error.message}`, 'ERROR');
    }
  }

  performHealthCheck() {
    if (this.isShuttingDown) return;
    
    const stats = {
      timestamp: new Date().toISOString(),
      gatewayRunning: this.isGatewayRunning(),
      gatewayResponsive: this.checkGatewayResponsiveness(),
      restartCount: this.restartCount,
      uptime: process.uptime()
    };
    
    this.log(`Health Check: ${JSON.stringify(stats)}`);
    
    // Alert on issues
    if (!stats.gatewayResponsive) {
      this.log('🚨 HEALTH ALERT: Gateway not responsive!', 'ERROR');
    }
    
    if (this.restartCount > 5) {
      this.log('⚠️  Multiple restarts detected - check logs', 'WARN');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  restartNow(reason) {
    this.log(`🔧 Manual restart requested: ${reason}`);
    this.restartGateway('Manual restart');
  }

  shutdown(signal) {
    this.isShuttingDown = true;
    this.log(`👋 Shutting down watchdog (signal: ${signal})`);
    
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    if (this.healthInterval) clearInterval(this.healthInterval);
    
    if (this.gatewayProcess) {
      this.gatewayProcess.kill('SIGTERM');
    }
    
    process.exit(0);
  }
}

// Start the watchdog
const watchdog = new OpenClawWatchdog();
watchdog.start();

module.exports = { OpenClawWatchdog };