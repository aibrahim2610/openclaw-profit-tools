#!/usr/bin/env node

/**
 * OpenClaw Integration with Long-Term Memory
 * Integrates memory system with OpenClaw
 */

const { LongTermMemory, memorySystem } = require('./long-term-memory.js');
const fs = require('fs');
const path = require('path');

class OpenClawMemoryIntegration {
  constructor() {
    this.memory = memorySystem;
    this.currentSession = null;
    
    // Start memory system
    this.memory.start();
    
    // Setup OpenClaw integration
    this.setupOpenClawIntegration();
    
    console.log('🔗 OpenClaw Memory Integration Active');
  }
  
  setupOpenClawIntegration() {
    // This would hook into OpenClaw's message processing
    // For now, we'll simulate it
    
    // Override OpenClaw's message handling (in a real implementation)
    // We'll just show how it would work
    this.originalMessageProcessor = null;
  }
  
  /**
   * Process OpenClaw message
   */
  async processMessage(message, role = 'assistant') {
    try {
      const sessionId = this.getCurrentSessionId();
      
      if (!sessionId) {
        // New session
        const newSessionId = uuidv4();
        this.currentSession = {
          sessionId: newSessionId,
          role,
          message,
          timestamp: new Date().toISOString()
        };
        
        // Save to memory
        await this.memory.saveSession(newSessionId, this.currentSession);
        
        console.log('💬 New session started and saved to memory');
        return newSessionId;
        
      } else {
        // Continue session
        const session = await this.memory.loadSession(sessionId);
        if (!session) {
          // Session not found, create new
          return await this.processMessage(message, role);
        }
        
        // Update session
        session.lastActivity = new Date().toISOString();
        session.sessionData = message;
        
        // Save updated session
        await this.memory.saveSession(sessionId, session);
        
        console.log('🔄 Session continued and updated');
        return sessionId;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return null;
    }
  }
  
  /**
   * Get current session ID
   */
  getCurrentSessionId() {
    // In a real implementation, this would come from OpenClaw context
    // For now, return null to simulate new session each time
    return null;
  }
  
  /**
   * Search memory
   */
  async searchMemory(query, limit = 10) {
    try {
      const results = await this.memory.searchSessions(query, limit);
      
      console.log('🔍 Search results:');
      results.forEach((result, index) = > {
        console.log(`${index + 1}. ${result.snippet}...`);
        console.log(`   Session: ${result.sessionId} | Importance: ${result.importance} | Tags: ${result.tags.join(', ')}`);
        console.log('');
      });
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
  
  /**
   * Get recent sessions
   */
  async getRecentSessions(limit = 10) {
    try {
      const sessions = await this.memory.getRecentSessions(limit);
      
      console.log('📋 Recent sessions:');
      sessions.forEach((session, index) = > {
        console.log(`${index + 1}. ${session.sessionId} | ${session.timestamp} | Importance: ${session.importance}`);
        console.log(`   Tags: ${session.tags.join(', ')}`);
        console.log('');
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }
  
  /**
   * Get important sessions
   */
  async getImportantSessions(limit = 10) {
    try {
      const sessions = await this.memory.getImportantSessions(limit);
      
      console.log('⭐ Important sessions:');
      sessions.forEach((session, index) = > {
        console.log(`${index + 1}. ${session.sessionId} | Importance: ${session.importance} | ${session.timestamp}`);
        console.log(`   Tags: ${session.tags.join(', ')}`);
        console.log('');
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting important sessions:', error);
      return [];
    }
  }
  
  /**
   * Get memory stats
   */
  getMemoryStats() {
    const stats = this.memory.getStats();
    
    console.log('📊 Memory Stats:');
    console.log(`   Total Sessions: ${stats.totalSessions}`);
    console.log(`   Recent Sessions: ${stats.recentSessions}`);
    console.log(`   Memory Usage: RSS: ${stats.memoryUsage.rss}MB, Heap: ${stats.memoryUsage.heapUsed}MB`);
    console.log(`   Last Save: ${stats.lastActivity}`);
    
    return stats;
  }
  
  /**
   * Stop memory system
   */
  stop() {
    if (this.memory) {
      this.memory.stop();
    }
    console.log('🛑 Memory system stopped');
  }
}

// Export
module.exports = { OpenClawMemoryIntegration, memorySystem };