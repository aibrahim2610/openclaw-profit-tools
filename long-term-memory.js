#!/usr/bin/env node

/**
 * Complete Long-Term Memory & Session Management System
 * يحفظ كل المحادثات (قصيرة وطويلة المدى) مع البحث والاسترجاع
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class LongTermMemory {
  constructor() {
    this.baseDir = '/root/.openclaw/workspace';
    this.memoryDir = path.join(this.baseDir, 'memory', 'sessions');
    this.archiveDir = path.join(this.baseDir, 'memory', 'archives');
    this.indexFile = path.join(this.baseDir, 'memory', 'index.json');
    
    this.config = {
      autoSaveInterval: 300000, // 5 minutes
      maxRecentSessions: 100,
      maxArchiveAge: 30, // days
      minImportanceForArchive: 5, // importance score 0-10
    };
    
    this.sessions = new Map();
    this.sessionIndex = {
      recent: [],
      important: [],
      tags: {},
      dates: {}
    };
    
    // Ensure directories
    this.ensureDirectories();
    
    // Load existing data
    this.loadIndex();
    
    // Start auto-save
    this.autoSaveInterval = setInterval(() => this.saveIndex(), this.config.autoSaveInterval);
    
    console.log('🧠 Long-Term Memory System initialized');
  }
  
  ensureDirectories() {
    [this.memoryDir, this.archiveDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  async saveSession(sessionId, sessionData) {
    try {
      const timestamp = new Date();
      const session = {
        sessionId,
        sessionData,
        timestamp: timestamp.toISOString(),
        lastActivity: timestamp.toISOString(),
        importance: this.calculateImportance(sessionData),
        tags: this.extractTags(sessionData),
        wordCount: this.countWords(sessionData)
      };
      
      // Save to disk
      const sessionFile = path.join(this.memoryDir, `${sessionId}.json`);
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
      
      // Update in-memory
      this.sessions.set(sessionId, session);
      
      // Update index
      this.updateIndex(sessionId, session);
      
      console.log(`💾 Session saved: ${sessionId} (Importance: ${session.importance})`);
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  }
  
  async loadSession(sessionId) {
    try {
      // Try memory first
      if (this.sessions.has(sessionId)) {
        return this.sessions.get(sessionId);
      }
      
      // Try disk
      const sessionFile = path.join(this.memoryDir, `${sessionId}.json`);
      if (!fs.existsSync(sessionFile)) {
        // Try archive
        const archiveFile = path.join(this.archiveDir, `${sessionId}.json`);
        if (fs.existsSync(archiveFile)) {
          const content = fs.readFileSync(archiveFile, 'utf8');
          const session = JSON.parse(content);
          this.sessions.set(sessionId, session);
          return session;
        }
        return null;
      }
      
      const content = fs.readFileSync(sessionFile, 'utf8');
      const session = JSON.parse(content);
      
      // Update last activity
      session.lastActivity = new Date().toISOString();
      this.sessions.set(sessionId, session);
      
      // Re-save with updated activity
      fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));
      
      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }
  
  async searchSessions(query, limit = 20) {
    try {
      const results = [];
      const queryLower = query.toLowerCase();
      
      // Search all session files (could be slow for many sessions - would need optimization)
      const sessionFiles = fs.readdirSync(this.memoryDir);
      
      for (const file of sessionFiles) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.memoryDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const session = JSON.parse(content);
        
        // Search in sessionData content
        const sessionStr = JSON.stringify(session.sessionData).toLowerCase();
        if (sessionStr.includes(queryLower)) {
          results.push({
            sessionId: session.sessionId,
            snippet: this.extractSnippet(sessionStr, queryLower),
            timestamp: session.timestamp,
            importance: session.importance,
            tags: session.tags
          });
        }
      }
      
      // Sort by importance and date
      results.sort((a, b) => {
        if (b.importance !== a.importance) {
          return b.importance - a.importance;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      return results.slice(0, limit);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
  
  extractSnippet(content, query, contextSize = 100) {
    const index = content.indexOf(query);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextSize);
    const end = Math.min(content.length, index + query.length + contextSize);
    
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }
  
  async getRecentSessions(limit = 10) {
    const recentIds = this.sessionIndex.recent.slice(0, limit);
    const sessions = [];
    
    for (const sessionId of recentIds) {
      const session = await this.loadSession(sessionId);
      if (session) sessions.push(session);
    }
    
    return sessions;
  }
  
  async getImportantSessions(limit = 10) {
    const importantIds = [...this.sessionIndex.important]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
    
    const sessions = [];
    for (const sessionId of importantIds) {
      const session = await this.loadSession(sessionId);
      if (session) sessions.push(session);
    }
    
    return sessions;
  }
  
  async getSessionsByTag(tag, limit = 20) {
    const taggedIds = this.sessionIndex.tags[tag] || [];
    const sessions = [];
    
    for (const sessionId of taggedIds.slice(0, limit)) {
      const session = await this.loadSession(sessionId);
      if (session) sessions.push(session);
    }
    
    return sessions;
  }
  
  calculateImportance(sessionData) {
    let score = 0;
    
    // Check for important content patterns
    if (!sessionData.sessionData || !sessionData.sessionData.content) return 0;
    
    const content = JSON.stringify(sessionData.sessionData.content).toLowerCase();
    
    // Keywords indicating importance
    const importantKeywords = [
      'important', 'critical', 'urgent', 'priority', 'password', 'secret', 'key',
      'config', 'setup', 'install', 'error', 'debug', 'fail', 'warning',
      'money', 'payment', 'profit', 'revenue', 'financial', 'earnings'
    ];
    
    importantKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 5;
      }
    });
    
    // Length matters (longer conversations might be more important)
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 500) score += 10;
    else if (wordCount > 200) score += 5;
    
    // User messages are important
    if (sessionData.sessionData.role === 'user') {
      score += 10;
    }
    
    // Has tool calls?
    if (sessionData.sessionData.toolCalls && sessionData.sessionData.toolCalls.length > 0) {
      score += 15;
    }
    
    return Math.min(10, score); // Cap at 10
  }
  
  extractTags(sessionData) {
    const tags = new Set();
    
    if (!sessionData.sessionData || !sessionData.sessionData.content) return [];
    
    const content = JSON.stringify(sessionData.sessionData.content).toLowerCase();
    
    // Extract common tags
    const tagPatterns = [
      { pattern: /error|fail|exception|bug/i, tag: 'error' },
      { pattern: /config|setting|setup|install/i, tag: 'configuration' },
      { pattern: /api|endpoint|request|response/i, tag: 'api' },
      { pattern: /database|sql|query|table/i, tag: 'database' },
      { pattern: /network|http|tcp|socket|connection/i, tag: 'network' },
      { pattern: /security|auth|login|password|token/i, tag: 'security' },
      { pattern: /performance|slow|fast|optimize/i, tag: 'performance' },
      { pattern: /memory|ram|cpu|resource/i, tag: 'memory' },
      { pattern: /profit|revenue|money|earn|income/i, tag: 'finance' },
      { pattern: /profit|revenue|money|earn|income/i, tag: 'profit' }
    ];
    
    tagPatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(content)) {
        tags.add(tag);
      }
    });
    
    return Array.from(tags);
  }
  
  countWords(sessionData) {
    if (!sessionData.sessionData || !sessionData.sessionData.content) return 0;
    const content = JSON.stringify(sessionData.sessionData.content);
    return content.split(/\s+/).filter(w => w.length > 0).length;
  }
  
  updateIndex(sessionId, session) {
    // Add to recent
    this.sessionIndex.recent = this.sessionIndex.recent.filter(id => id !== sessionId);
    this.sessionIndex.recent.unshift(sessionId);
    if (this.sessionIndex.recent.length > this.config.maxRecentSessions) {
      this.sessionIndex.recent.pop();
    }
    
    // Add to important if high score
    if (session.importance >= this.config.minImportanceForArchive) {
      this.sessionIndex.important = this.sessionIndex.important.filter(id => id !== sessionId);
      this.sessionIndex.important.push(sessionId);
    }
    
    // Update tags
    session.tags.forEach(tag => {
      if (!this.sessionIndex.tags[tag]) {
        this.sessionIndex.tags[tag] = [];
      }
      this.sessionIndex.tags[tag] = this.sessionIndex.tags[tag].filter(id => id !== sessionId);
      this.sessionIndex.tags[tag].unshift(sessionId);
    });
    
    // Update dates
    const dateKey = session.timestamp.split('T')[0]; // YYYY-MM-DD
    if (!this.sessionIndex.dates[dateKey]) {
      this.sessionIndex.dates[dateKey] = [];
    }
    this.sessionIndex.dates[dateKey].push(sessionId);
  }
  
  async archiveOldSessions() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.maxArchiveAge);
      
      let archivedCount = 0;
      
      for (const [sessionId, session] of this.sessions) {
        const sessionDate = new Date(session.timestamp);
        if (sessionDate < cutoffDate && session.importance < this.config.minImportanceForArchive) {
          // Move to archive
          const sourceFile = path.join(this.memoryDir, `${sessionId}.json`);
          const destFile = path.join(this.archiveDir, `${sessionId}.json`);
          
          if (fs.existsSync(sourceFile)) {
            fs.renameSync(sourceFile, destFile);
            this.sessions.delete(sessionId);
            
            // Remove from index
            this.sessionIndex.recent = this.sessionIndex.recent.filter(id => id !== sessionId);
            this.sessionIndex.important = this.sessionIndex.important.filter(id => id !== sessionId);
            
            archivedCount++;
          }
        }
      }
      
      if (archivedCount > 0) {
        console.log(`📦 Archived ${archivedCount} old sessions`);
      }
      
      return archivedCount;
    } catch (error) {
      console.error('Archive error:', error);
      return 0;
    }
  }
  
  saveIndex() {
    try {
      const indexData = {
        timestamp: new Date().toISOString(),
        recent: this.sessionIndex.recent,
        important: this.sessionIndex.important,
        tags: this.sessionIndex.tags,
        dates: this.sessionIndex.dates,
        totalSessions: this.sessions.size
      };
      
      fs.writeFileSync(this.indexFile, JSON.stringify(indexData, null, 2));
    } catch (error) {
      console.error('Error saving index:', error);
    }
  }
  
  loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        const content = fs.readFileSync(this.indexFile, 'utf8');
        const indexData = JSON.parse(content);
        
        this.sessionIndex.recent = indexData.recent || [];
        this.sessionIndex.important = indexData.important || [];
        this.sessionIndex.tags = indexData.tags || {};
        this.sessionIndex.dates = indexData.dates || {};
        
        console.log(`📚 Loaded memory index: ${indexData.totalSessions || 0} sessions`);
      }
    } catch (error) {
      console.error('Error loading index:', error);
    }
  }
  
  getStats() {
    return {
      totalSessions: this.sessions.size,
      recentSessions: this.sessionIndex.recent.length,
      importantSessions: this.sessionIndex.important.length,
      tags: Object.keys(this.sessionIndex.tags).length,
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      lastSave: new Date().toISOString()
    };
  }
  
  stop() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.saveIndex();
    console.log('🧠 Memory system stopped');
  }
}

// Export as singleton
const memorySystem = new LongTermMemory();

/**
 * Integration with OpenClaw
 * You can import this and call memorySystem.saveSession() whenever a conversation happens
 */

// Example usage:
/*
// When a new message arrives:
memorySystem.saveSession(sessionId, {
  role: 'user',
  content: message,
  timestamp: new Date().toISOString(),
  sessionKey: sessionKey
});

// To retrieve recent conversations:
const recent = await memorySystem.getRecentSessions(5);

// To search:
const results = await memorySystem.searchSessions('password', 10);

// To get by tag:
const financeSessions = await memorySystem.getSessionsByTag('finance');
*/

module.exports = { LongTermMemory, memorySystem };