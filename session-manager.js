#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Session Manager
 * حل بديل لإدارة الجلسات يدوياً
 */
export class ManualSessionManager {
  private sessionsDir: string;
  private sessionTtlMs: number = 30 * 24 * 60 * 60 * 1000; // 30 days
  private maxSessions: number = 1000;

  constructor() {
    this.sessionsDir = path.join(__dirname, '../session-backups');
    
    // Ensure directory exists
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
    
    // Load existing sessions
    this.loadAllSessions();
  }

  /**
   * Save session manually
   */
  async saveSession(sessionId: string, sessionData: any): Promise<void> {
    try {
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      const sessionInfo = {
        sessionId,
        sessionData,
        savedAt: new Date().toISOString(),
        ttl: this.sessionTtlMs
      };
      
      fs.writeFileSync(sessionFile, JSON.stringify(sessionInfo, null, 2));
      console.log(`Session ${sessionId} saved successfully`);
    } catch (error) {
      console.error(`Error saving session ${sessionId}:`, error);
    }
  }

  /**
   * Load session manually
   */
  async loadSession(sessionId: string): Promise<any | null> {
    try {
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      
      if (!fs.existsSync(sessionFile)) {
        return null;
      }
      
      const sessionInfo = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      
      // Check TTL
      const savedAt = new Date(sessionInfo.savedAt);
      const now = new Date();
      if (now.getTime() - savedAt.getTime() > this.sessionTtlMs) {
        this.deleteSession(sessionId);
        return null;
      }
      
      return sessionInfo.sessionData;
    } catch (error) {
      console.error(`Error loading session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Delete session manually
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.json`);
      if (fs.existsSync(sessionFile)) {
        fs.unlinkSync(sessionFile);
        console.log(`Session ${sessionId} deleted`);
      }
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
    }
  }

  /**
   * Load all sessions
   */
  async loadAllSessions(): Promise<any[]> {
    try {
      const sessionFiles = fs.readdirSync(this.sessionsDir);
      const sessions = [];
      
      for (const file of sessionFiles) {
        if (file.endsWith('.json')) {
          try {
            const sessionInfo = JSON.parse(fs.readFileSync(path.join(this.sessionsDir, file), 'utf8'));
            sessions.push(sessionInfo);
          } catch (error) {
            console.error(`Error loading session file ${file}:`, error);
          }
        }
      }
      
      console.log(`Loaded ${sessions.length} sessions from backup`);
      return sessions;
    } catch (error) {
      console.error('Error loading all sessions:', error);
      return [];
    }
  }

  /**
   * Cleanup old sessions
   */
  async cleanupOldSessions(): Promise<number> {
    try {
      const sessionFiles = fs.readdirSync(this.sessionsDir);
      let deletedCount = 0;
      
      for (const file of sessionFiles) {
        if (file.endsWith('.json')) {
          const sessionInfo = JSON.parse(fs.readFileSync(path.join(this.sessionsDir, file), 'utf8'));
          const savedAt = new Date(sessionInfo.savedAt);
          const now = new Date();
          
          if (now.getTime() - savedAt.getTime() > this.sessionTtlMs) {
            this.deleteSession(sessionInfo.sessionId);
            deletedCount++;
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old sessions`);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
      return 0;
    }
  }

  /**
   * Export all sessions
   */
  async exportAllSessions(exportPath?: string): Promise<string> {
    try {
      const exportFile = exportPath || path.join(this.sessionsDir, `sessions-export-${Date.now()}.json`);
      const allSessions = await this.loadAllSessions();
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalSessions: allSessions.length,
        sessions: allSessions
      };
      
      fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
      console.log(`Exported all sessions to ${exportFile}`);
      return exportFile;
    } catch (error) {
      console.error('Error exporting sessions:', error);
      throw error;
    }
  }
}

// Export for use in other modules
export const sessionManager = new ManualSessionManager();

/**
 * Helper functions for session management
 */
export function saveImportantSession(sessionId: string, sessionData: any) {
  return sessionManager.saveSession(sessionId, {
    ...sessionData,
    priority: 'high',
    importantContext: extractImportantContext(sessionData)
  });
}

export function extractImportantContext(sessionData: any) {
  // Extract important information from session data
  const important = {
    users: [],
    projects: [],
    decisions: [],
    context: []
  };
  
  try {
    // This would need to be customized based on your actual session structure
    // For now, return empty
  } catch (error) {
    console.error('Error extracting important context:', error);
  }
  
  return important;
}

export function recoverSession(sessionId: string) {
  return sessionManager.loadSession(sessionId);
}

export function listAllSessions() {
  return sessionManager.loadAllSessions();
}

export function cleanupSessions() {
  return sessionManager.cleanupOldSessions();
}