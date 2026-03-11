import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Session Persistence Manager
 * يحفظ الجلسات المهمة على القرص لمنع فقدانها عند إعادة التشغيل أو الخمول الطويل
 */
export class SessionPersistence extends EventEmitter {
  private db: any;
  private persistenceDir: string;
  private autoSaveInterval: NodeJS.Timeout;
  private maxSessionsPerUser: number = 100;
  private sessionTtlDays: number = 30;

  constructor(dbInstance: any) {
    super();
    this.db = dbInstance;
    this.persistenceDir = path.join(__dirname, '../session-data');
    
    // Ensure directory exists
    if (!fs.existsSync(this.persistenceDir)) {
      fs.mkdirSync(this.persistenceDir, { recursive: true });
    }
    
    // Initialize persistence tables
    this.initializeTables();
    
    // Start auto-save every 5 minutes
    this.autoSaveInterval = setInterval(() => this.saveAllActiveSessions(), 5 * 60 * 1000);
    
    // Load sessions on startup
    this.loadAllSessions();
  }

  private async initializeTables(): Promise<void> {
    await new Promise((resolve, reject) = > {
      this.db.serialize(function() {
        this.db.run(`CREATE TABLE IF NOT EXISTS session_history (
          session_id TEXT PRIMARY KEY,
          session_key TEXT NOT NULL,
          cwd TEXT NOT NULL,
          conversation_history TEXT NOT NULL,
          metadata TEXT,
          last_activity TEXT NOT NULL,
          created_at TEXT NOT NULL,
          priority INTEGER DEFAULT 0,
          tags TEXT
        )`);
        
        this.db.run(`CREATE TABLE IF NOT EXISTS session_summaries (
          session_id TEXT PRIMARY KEY,
          summary TEXT NOT NULL,
          token_count INTEGER DEFAULT 0,
          important_context TEXT,
          created_at TEXT NOT NULL
        )`);
        
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_session_activity ON session_history(last_activity)`);
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_session_priority ON session_history(priority)`);
        
        resolve();
      });
    });
  }

  /**
   * Save a session to persistent storage
   */
  async saveSession(sessionData: {
    sessionId: string;
    sessionKey: string;
    cwd: string;
    conversationHistory: any[];
    metadata?: any;
    priority?: number;
    tags?: string[];
  }): Promise<void> {
    try {
      const now = new Date().toISOString();
      const historyJson = JSON.stringify(conversationHistory);
      const metadataJson = JSON.stringify(metadata || {});
      const tagsJson = JSON.stringify(tags || []);
      
      await new Promise((resolve, reject) = > {
        this.db.run(
          `INSERT OR REPLACE INTO session_history 
           (session_id, session_key, cwd, conversation_history, metadata, last_activity, created_at, priority, tags)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sessionData.sessionId,
            sessionData.sessionKey,
            sessionData.cwd,
            historyJson,
            metadataJson,
            now,
            sessionData.priority || 0,
            tagsJson
          ],
          function(err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });
      
      this.emit('sessionSaved', { sessionId: sessionData.sessionId, timestamp: now });
    } catch (error) {
      this.emit('error', { action: 'saveSession', error });
    }
  }

  /**
   * Load a session from persistent storage
   */
  async loadSession(sessionId: string): Promise<any | null> {
    try {
      return await new Promise((resolve, reject) = > {
        this.db.get(
          `SELECT * FROM session_history WHERE session_id = ?`,
          [sessionId],
          (err, row) = > {
            if (err) return reject(err);
            if (!row) return resolve(null);
            
            resolve({
              sessionId: row.session_id,
              sessionKey: row.session_key,
              cwd: row.cwd,
              conversationHistory: JSON.parse(row.conversation_history || '[]'),
              metadata: JSON.parse(row.metadata || '{}'),
              lastActivity: row.last_activity,
              createdAt: row.created_at,
              priority: row.priority,
              tags: JSON.parse(row.tags || '[]')
            });
          }
        );
      });
    } catch (error) {
      this.emit('error', { action: 'loadSession', error });
      return null;
    }
  }

  /**
   * Load all sessions for a specific session key
   */
  async loadSessionsByKey(sessionKey: string): Promise<any[]> {
    try {
      return await new Promise((resolve, reject) = > {
        this.db.all(
          `SELECT * FROM session_history 
           WHERE session_key = ? 
           ORDER BY last_activity DESC 
           LIMIT ?`,
          [sessionKey, this.maxSessionsPerUser],
          (err, rows) = > {
            if (err) return reject(err);
            resolve(rows.map(row = > ({
              sessionId: row.session_id,
              sessionKey: row.session_key,
              cwd: row.cwd,
              conversationHistory: JSON.parse(row.conversation_history || '[]'),
              metadata: JSON.parse(row.metadata || '{}'),
              lastActivity: row.last_activity,
              createdAt: row.created_at,
              priority: row.priority,
              tags: JSON.parse(row.tags || '[]')
            })));
          }
        );
      });
    } catch (error) {
      this.emit('error', { action: 'loadSessionsByKey', error });
      return [];
    }
  }

  /**
   * Save a session summary for quick retrieval
   */
  async saveSessionSummary(sessionId: string, summary: string, tokenCount: number, importantContext?: any): Promise<void> {
    try {
      await new Promise((resolve, reject) = > {
        this.db.run(
          `INSERT OR REPLACE INTO session_summaries 
           (session_id, summary, token_count, important_context, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          [
            sessionId,
            summary,
            tokenCount,
            JSON.stringify(importantContext || {}),
            new Date().toISOString()
          ],
          function(err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    } catch (error) {
      this.emit('error', { action: 'saveSessionSummary', error });
    }
  }

  /**
   * Get all sessions that need recovery (recently active but not in memory)
   */
  async getSessionsForRecovery(): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Last 7 days
    
    try {
      return await new Promise((resolve, reject) = > {
        this.db.all(
          `SELECT * FROM session_history 
           WHERE last_activity > ? 
           AND priority > 0
           ORDER BY priority DESC, last_activity DESC
           LIMIT 50`,
          [cutoffDate.toISOString()],
          (err, rows) = > {
            if (err) return reject(err);
            resolve(rows.map(row = > ({
              sessionId: row.session_id,
              sessionKey: row.session_key,
              cwd: row.cwd,
              conversationHistory: JSON.parse(row.conversation_history || '[]'),
              metadata: JSON.parse(row.metadata || '{}'),
              lastActivity: row.last_activity,
              priority: row.priority
            })));
          }
        );
      });
    } catch (error) {
      this.emit('error', { action: 'getSessionsForRecovery', error });
      return [];
    }
  }

  /**
   * Mark a session as priority for preservation
   */
  async markSessionPriority(sessionId: string, priority: number = 10): Promise<void> {
    try {
      await new Promise((resolve, reject) = > {
        this.db.run(
          `UPDATE session_history SET priority = ? WHERE session_id = ?`,
          [priority, sessionId],
          function(err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    } catch (error) {
      this.emit('error', { action: 'markSessionPriority', error });
    }
  }

  /**
   * Clean up old sessions
   */
  async cleanupOldSessions(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.sessionTtlDays);
    
    try {
      return await new Promise((resolve, reject) = > {
        this.db.run(
          `DELETE FROM session_history WHERE last_activity < ? AND priority = 0`,
          [cutoffDate.toISOString()],
          function(err) {
            if (err) return reject(err);
            resolve(this.changes);
          }
        );
      });
    } catch (error) {
      this.emit('error', { action: 'cleanupOldSessions', error });
      return 0;
    }
  }

  /**
   * Auto-save all active sessions (to be called periodically)
   */
  private async saveAllActiveSessions(): Promise<void> {
    this.emit('autoSave', { timestamp: new Date().toISOString() });
    
    // Clean up old sessions
    const deleted = await this.cleanupOldSessions();
    if (deleted > 0) {
      this.emit('sessionsCleaned', { count: deleted });
    }
  }

  /**
   * Load all sessions into memory cache on startup
   */
  private async loadAllSessions(): Promise<void> {
    try {
      const recentSessions = await this.getSessionsForRecovery();
      this.emit('sessionsLoaded', { count: recentSessions.length });
    } catch (error) {
      this.emit('error', { action: 'loadAllSessions', error });
    }
  }

  /**
   * Export all sessions for backup
   */
  async exportAllSessions(exportPath?: string): Promise<string> {
    const exportFile = exportPath || path.join(this.persistenceDir, `sessions-export-${Date.now()}.json`);
    
    try {
      const sessions = await new Promise((resolve, reject) = > {
        this.db.all(`SELECT * FROM session_history`, [], (err, rows) = > {
          if (err) return reject(err);
          resolve(rows);
        });
      });
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalSessions: sessions.length,
        sessions: sessions
      };
      
      fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
      return exportFile;
    } catch (error) {
      this.emit('error', { action: 'exportAllSessions', error });
      throw error;
    }
  }

  /**
   * Stop the persistence manager
   */
  stop(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}

/**
 * Create an enhanced session store with persistence
 */
export function createPersistentSessionStore(baseStore: any, persistence: SessionPersistence) {
  return {
    ...baseStore,
    
    // Override createSession to also save important sessions
    createSession: async (params: { sessionKey: string; cwd: string; sessionId?: string }) => {
      const session = baseStore.createSession(params);
      
      // Mark high-priority sessions for persistence
      if (params.sessionKey === 'main' || session.sessionId.startsWith('priority-')) {
        await persistence.markSessionPriority(session.sessionId, 20);
      }
      
      return session;
    },
    
    // Get session with recovery attempt
    getSession: async (sessionId: string) => {
      let session = baseStore.getSession(sessionId);
      
      if (!session) {
        // Try to recover from persistence
        const persisted = await persistence.loadSession(sessionId);
        if (persisted) {
          session = baseStore.createSession({
            sessionKey: persisted.sessionKey,
            cwd: persisted.cwd,
            sessionId: persisted.sessionId
          });
          session.conversationHistory = persisted.conversationHistory;
          session.metadata = persisted.metadata;
        }
      }
      
      return session;
    }
  };
}