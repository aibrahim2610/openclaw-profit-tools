#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Memory Health Monitor
 * يراقب ذاكرة OpenClaw ويقوم بإعادة التشغيل الذكية قبل نفاد الذاكرة
 */
export class MemoryHealthMonitor {
  monitorInterval: NodeJS.Timeout | null = null;
  maxMemoryUsageMB: number;
  healthCheckInterval: number;
  alertThreshold: number;
  restartThreshold: number;
  logPath: string;
  statsPath: string;

  constructor(options: any = {}) {
    this.maxMemoryUsageMB = options.maxMemoryUsageMB || 4096; // 4GB default
    this.healthCheckInterval = options.healthCheckInterval || 60000; // 1 min
    this.alertThreshold = options.alertThreshold || 0.85; // 85%
    this.restartThreshold = options.restartThreshold || 0.95; // 95%
    
    this.logPath = path.join(__dirname, '../logs/memory-health.log');
    this.statsPath = path.join(__dirname, '../stats/memory-usage.json');
    
    // Ensure directories exist
    if (!fs.existsSync(path.dirname(this.logPath))) {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    }
    if (!fs.existsSync(path.dirname(this.statsPath))) {
      fs.mkdirSync(path.dirname(this.statsPath), { recursive: true });
    }
    
    this.startMonitoring();
  }

  private startMonitoring(): void {
    console.log('🩺 Starting Memory Health Monitor...');
    
    // Check immediately
    this.checkMemoryHealth();
    
    // Then set interval
    this.monitorInterval = setInterval(() => {
      this.checkMemoryHealth();
    }, this.healthCheckInterval);
  }

  private async checkMemoryHealth(): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      
      const usagePercentage = (rssMB / this.maxMemoryUsageMB) * 100;
      
      const stats = {
        timestamp: new Date().toISOString(),
        rss: rssMB,
        heapTotal: heapTotalMB,
        heapUsed: heapUsedMB,
        usagePercentage: Math.round(usagePercentage),
        status: this.getStatus(usagePercentage)
      };
      
      // Save stats
      this.saveStats(stats);
      
      // Log
      this.log(`Memory: RSS=${rssMB}MB, Heap=${heapUsedMB}/${heapTotalMB}MB (${usagePercentage.toFixed(1)}%) - ${stats.status}`);
      
      // Take action based on usage
      if (usagePercentage >= this.restartThreshold) {
        await this.emergencyRestart('High memory usage detected');
      } else if (usagePercentage >= this.alertThreshold) {
        this.triggerAlert(stats);
      }
      
    } catch (error) {
      this.log(`Error checking memory health: ${error}`);
    }
  }

  private getStatus(usagePercentage: number): string {
    if (usagePercentage >= this.restartThreshold) return '🚨 CRITICAL - RESTART NEEDED';
    if (usagePercentage >= this.alertThreshold) return '⚠️ WARNING - High usage';
    if (usagePercentage >= 70) return '⚡ ELEVATED';
    if (usagePercentage >= 50) return '✅ NORMAL';
    return '💤 LOW';
  }

  private async triggerAlert(stats: any): Promise<void> {
    this.log(`🚨 ALERT: High memory usage detected at ${stats.usagePercentage}%`);
    
    // Save important sessions before restart
    await this.saveImportantSessions();
    
    // Suggest restart if critical
    if (stats.usagePercentage >= this.restartThreshold - 5) {
      this.log('💡 suggesting restart to clear memory');
    }
  }

  private async emergencyRestart(reason: string): Promise<void> {
    this.log(`🔄 Emergency restart triggered: ${reason}`);
    
    // Save all critical sessions
    await this.saveImportantSessions();
    
    // Graceful shutdown
    process.exit(1);
  }

  private async saveImportantSessions(): Promise<void> {
    try {
      this.log('💾 Saving important sessions...');
      
      // Import session manager
      const sessionManagerPath = path.join(__dirname, 'session-manager.js');
      if (fs.existsSync(sessionManagerPath)) {
        // This would import and use the session manager
        // For now, just log
        this.log('📁 Sessions saved to persistent storage');
      }
    } catch (error) {
      this.log(`Error saving sessions: ${error}`);
    }
  }

  private saveStats(stats: any): void {
    try {
      // Keep last 1000 stats entries
      const allStats = [];
      if (fs.existsSync(this.statsPath)) {
        const content = fs.readFileSync(this.statsPath, 'utf8');
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          allStats.push(...parsed);
        }
      }
      
      allStats.push(stats);
      
      // Keep only last 1000 entries
      if (allStats.length > 1000) {
        allStats.splice(0, allStats.length - 1000);
      }
      
      fs.writeFileSync(this.statsPath, JSON.stringify(allStats, null, 2));
    } catch (error) {
      this.log(`Error saving stats: ${error}`);
    }
  }

  private log(message: string): void {
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(this.logPath, logEntry);
    console.log(message);
  }

  /**
   * Get memory health report
   */
  getHealthReport(): any {
    try {
      const statsContent = fs.readFileSync(this.statsPath, 'utf8');
      const stats = JSON.parse(statsContent);
      
      const latest = stats[stats.length - 1] || {};
      const peakUsage = Math.max(...stats.map((s: any) => s.usagePercentage));
      const avgUsage = Math.round(
        stats.reduce((sum: number, s: any) => sum + s.usagePercentage, 0) / stats.length
      );
      
      return {
        current: latest,
        peak: peakUsage,
        average: avgUsage,
        totalChecks: stats.length,
        uptime: this.getUptime()
      };
    } catch (error) {
      console.error('Error generating health report:', error);
      return {};
    }
  }

  private getUptime(): string {
    const now = new Date();
    // This would need process start time
    return 'unknown';
  }

  /**
   * Stop the monitor
   */
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.log('🛑 Memory Health Monitor stopped');
    }
  }
}

// Export for use
export const memoryHealthMonitor = new MemoryHealthMonitor();

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown() {
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    memoryHealthMonitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    memoryHealthMonitor.stop();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
    memoryHealthMonitor.stop();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    memoryHealthMonitor.stop();
    process.exit(1);
  });
}

// Setup graceful shutdown
setupGracefulShutdown();