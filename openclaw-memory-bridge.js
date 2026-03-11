#!/usr/bin/env node

/**
 * OpenClaw Memory Bridge
 * يربط OpenClaw بنظام الذاكرة طويل المدى
 */

const { memorySystem } = require('./long-term-memory.js');
const { EventEmitter } = require('events');

class OpenClawMemoryBridge extends EventEmitter {
  constructor() {
    super();
    this.memory = memorySystem;
    this.isActive = false;
    
    console.log('🔗 OpenClaw Memory Bridge initialized');
  }
  
  /**
   * Start listening to OpenClaw messages (simulation)
   */
  start() {
    this.isActive = true;
    console.log('🌉 Memory bridge started');
    
    // In a real implementation, this would hook into OpenClaw's message bus
    // For now, we simulate incoming messages
    this.simulateTraffic();
  }
  
  /**
   * Simulate message traffic (replace with actual OpenClaw integration)
   */
  simulateTraffic() {
    // Example: Simulate messages every 30 seconds
    setInterval(() = > {
      if (Math.random() > 0.7) { // 30% chance
        this.handleIncomingMessage({
          sessionKey: 'test-user',
          role: 'user',
          content: {
            text: 'Test message at ' + new Date().toISOString()
          }
        });
      }
    }, 30000);
  }
  
  /**
   * Handle incoming message from OpenClaw
   */
  async handleIncomingMessage(message) {
    try {
      // Extract session ID from message context or generate new
      const sessionId = message.sessionId || `session-${Date.now()}`;
      
      // Save to memory
      await this.memory.saveSession(sessionId, message);
      
      this.emit('message:saved', { sessionId, message });
      
    } catch (error) {
      console.error('Error handling message:', error);
      this.emit('message:error', { error });
    }
  }
  
  /**
   * Search memory for past conversations
   */
  async search(query, limit = 10) {
    try {
      const results = await this.memory.searchSessions(query, limit);
      this.emit('search:results', { query, results });
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }
  
  /**
   * Get memory status
   */
  getStatus() {
    return this.memory.getStats();
  }
  
  stop() {
    this.isActive = false;
    this.memory.stop();
    console.log('🛑 Memory bridge stopped');
  }
}

// Create and export singleton
const memoryBridge = new OpenClawMemoryBridge();

// Example usage:
/*
// Start the bridge
memoryBridge.start();

// Search for something
memoryBridge.search('OpenClaw').then(results = > {
  console.log('Found:', results.length);
});

// Hook into OpenClaw events (in real implementation)
// openclaw.on('message', msg = > memoryBridge.handleIncomingMessage(msg));
*/

module.exports = { OpenClawMemoryBridge, memoryBridge };