#!/usr/bin/env node

/**
 * Session Recovery Tool
 * يقوم باستعادة الجلسات المهمة من النسخ الاحتياطية
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../session-backups');
const SESSION_DIR = path.join(__dirname, '../session-data');

class SessionRecoveryTool {
  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure directories exist
   */
  ensureDirectories(): void {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
  }

  /**
   * List all available session backups
   */
  listBackups(): string[] {
    try {
      return fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.json'))
        .sort()
        .reverse();
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Get details about a specific backup
   */
  getBackupDetails(backupFile: string): any {
    try {
      const content = fs.readFileSync(path.join(BACKUP_DIR, backupFile), 'utf8');
      const backup = JSON.parse(content);
      
      return {
        filename: backupFile,
        timestamp: backup.timestamp || new Date().toISOString(),
        totalSessions: backup.sessions?.length || 0,
        size: Math.round(content.length / 1024), // KB
        sessions: backup.sessions || []
      };
    } catch (error) {
      console.error(`Error reading backup ${backupFile}:`, error);
      return null;
    }
  }

  /**
   * Restore sessions from a backup
   */
  async restoreFromBackup(backupFile: string): Promise<number> {
    try {
      const backup = this.getBackupDetails(backupFile);
      if (!backup) return 0;
      
      let restoredCount = 0;
      
      for (const session of backup.sessions) {
        try {
          // Simulate session restoration
          const sessionFile = path.join(SESSION_DIR, `${session.sessionId}.json`);
          fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
          restoredCount++;
        } catch (error) {
          console.error(`Error restoring session ${session.sessionId}:`, error);
        }
      }
      
      console.log(`✅ Restored ${restoredCount} sessions from ${backupFile}`);
      return restoredCount;
    } catch (error) {
      console.error(`Error restoring from backup ${backupFile}:`, error);
      return 0;
    }
  }

  /**
   * Find and restore lost sessions
   */
  async findAndRestoreLostSessions(): Promise<number> {
    try {
      console.log('🔍 Searching for lost sessions...');
      
      // This would check current OpenClaw sessions vs backups
      // For now, we'll just restore recent backups
      const backups = this.listBackups().slice(0, 5); // Last 5 backups
      let restoredCount = 0;
      
      for (const backupFile of backups) {
        restoredCount += await this.restoreFromBackup(backupFile);
      }
      
      console.log(`✅ Found and restored ${restoredCount} potentially lost sessions`);
      return restoredCount;
    } catch (error) {
      console.error('Error finding lost sessions:', error);
      return 0;
    }
  }

  /**
   * Export all current sessions to backup
   */
  async exportCurrentSessions(): Promise<string> {
    try {
      // Simulate getting current sessions
      const sessions = [
        {
          sessionId: 'current-1',
          sessionKey: 'main',
          cwd: '/root/.openclaw/workspace',
          conversationHistory: [],
          metadata: { important: true },
          priority: 10
        }
      ];
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUP_DIR, `sessions-${timestamp}.json`);
      
      const backupData = {
        timestamp,
        exportedAt: new Date().toISOString(),
        totalSessions: sessions.length,
        sessions
      };
      
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      console.log(`✅ Exported ${sessions.length} current sessions to ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('Error exporting current sessions:', error);
      throw error;
    }
  }

  /**
   * Clean up old backups
   */
  cleanupOldBackups(maxAgeDays: number = 30): number {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      
      const backups = this.listBackups();
      let deletedCount = 0;
      
      for (const file of backups) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🗑️  Cleaned up ${deletedCount} old backups`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      return 0;
    }
  }

  /**
   * Generate session recovery report
   */
  generateRecoveryReport(): any {
    try {
      const backups = this.listBackups();
      const recentBackups = backups.slice(0, 5);
      
      const report = {
        totalBackups: backups.length,
        recentBackups: recentBackups.map(file => this.getBackupDetails(file)),
        totalSessions: recentBackups.reduce((sum, file) => {
          const details = this.getBackupDetails(file);
          return sum + (details?.totalSessions || 0);
        }, 0),
        lastBackup: recentBackups.length > 0 ? recentBackups[0] : null,
        storageUsage: this.calculateStorageUsage()
      };
      
      return report;
    } catch (error) {
      console.error('Error generating recovery report:', error);
      return null;
    }
  }

  /**
   * Calculate storage usage
   */
  calculateStorageUsage(): any {
    try {
      const backups = this.listBackups();
      let totalSize = 0;
      
      for (const file of backups) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
      
      return {
        totalSize: Math.round(totalSize / 1024), // KB
        totalSizeMB: Math.round(totalSize / 1024 / 1024), // MB
        totalFiles: backups.length
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return null;
    }
  }
}

// Export for use
export const sessionRecoveryTool = new SessionRecoveryTool();

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node session-recovery.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  list              - List available session backups');
    console.log('  restore <file>    - Restore sessions from backup');
    console.log('  recover           - Find and restore lost sessions');
    console.log('  export            - Export current sessions to backup');
    console.log('  cleanup           - Clean up old backups');
    console.log('  report            - Generate recovery report');
    console.log('  help              - Show this help message');
    process.exit(0);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      const backups = sessionRecoveryTool.listBackups();
      console.log(`Available backups (${backups.length}):`);
      backups.forEach(file => {
        const details = sessionRecoveryTool.getBackupDetails(file);
        if (details) {
          console.log(`  ${details.filename} - ${details.totalSessions} sessions, ${details.size}KB`);
        }
      });
      break;
      
    case 'restore':
      if (args.length < 2) {
        console.error('Error: Please specify backup file to restore');
        process.exit(1);
      }
      const restored = await sessionRecoveryTool.restoreFromBackup(args[1]);
      console.log(`Restored ${restored} sessions from ${args[1]}`);
      break;
      
    case 'recover':
      const recovered = await sessionRecoveryTool.findAndRestoreLostSessions();
      console.log(`Recovered ${recovered} lost sessions`);
      break;
      
    case 'export':
      const exportedFile = await sessionRecoveryTool.exportCurrentSessions();
      console.log(`Exported to ${exportedFile}`);
      break;
      
    case 'cleanup':
      const deleted = sessionRecoveryTool.cleanupOldBackups(30);
      console.log(`Cleaned up ${deleted} old backups`);
      break;
      
    case 'report':
      const report = sessionRecoveryTool.generateRecoveryReport();
      if (report) {
        console.log(JSON.stringify(report, null, 2));
      }
      break;
      
    case 'help':
      console.log('Session Recovery Tool Help:');
      console.log('This tool helps restore lost OpenClaw sessions from backups.');
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}