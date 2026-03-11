#!/usr/bin/env node

/**
 * Test Script for Long-Term Memory System
 */

const { memorySystem } = require('./long-term-memory.js');

console.log('🧪 Testing Long-Term Memory System\n');

async function testMemorySystem() {
  try {
    // Test 1: Save sessions
    console.log('📝 Test 1: Saving sessions...');
    
    await memorySystem.saveSession('test-session-1', {
      sessionId: 'test-session-1',
      sessionData: {
        role: 'user',
        content: 'What is OpenClaw?',
        timestamp: new Date().toISOString()
      }
    });
    
    await memorySystem.saveSession('test-session-2', {
      sessionId: 'test-session-2',
      sessionData: {
        role: 'user',
        content: 'How to configure memory in OpenClaw? This is important for our deployment.',
        timestamp: new Date().toISOString()
      }
    });
    
    await memorySystem.saveSession('test-session-3', {
      sessionId: 'test-session-3',
      sessionData: {
        role: 'user',
        content: 'I need help with profit system setup and revenue tracking.',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('✅ Saved 3 sessions');
    
    // Test 2: Search for OpenClaw
    console.log('\n🔍 Test 2: Searching for "OpenClaw"...');
    const searchResults = await memorySystem.searchSessions('OpenClaw');
    console.log(`Found ${searchResults.length} results`);
    searchResults.forEach(function(r) { 
      console.log(`  - ${r.sessionId}: ${r.snippet}`);
    });
    
    // Test 3: Search for "memory"
    console.log('\n🔍 Test 3: Searching for "memory"...');
    const memoryResults = await memorySystem.searchSessions('memory');
    console.log(`Found ${memoryResults.length} results`);
    
    // Test 4: Search for "profit"
    console.log('\n🔍 Test 4: Searching for "profit"...');
    const profitResults = await memorySystem.searchSessions('profit');
    console.log(`Found ${profitResults.length} results`);
    profitResults.forEach(function(r) { 
      console.log(`  - ${r.sessionId}: ${r.snippet}`);
    });
    
    // Test 5: Get recent sessions
    console.log('\n📋 Test 5: Getting recent sessions...');
    const recent = await memorySystem.getRecentSessions(5);
    console.log(`Found ${recent.length} recent sessions`);
    recent.forEach(function(s) { 
      console.log(`  - ${s.sessionId} (${s.timestamp})`);
    });
    
    // Test 6: Get important sessions
    console.log('\n⭐ Test 6: Getting important sessions...');
    const important = await memorySystem.getImportantSessions(5);
    console.log(`Found ${important.length} important sessions`);
    important.forEach(function(s) { 
      console.log(`  - ${s.sessionId} (Importance: ${s.importance})`);
    });
    
    // Test 7: Stats
    console.log('\n📊 Test 7: Memory stats');
    const stats = memorySystem.getStats();
    console.log(stats);
    
    // Test 8: Load session again (test persistence)
    console.log('\n💾 Test 8: Reloading sessions from disk...');
    const reloaded = await memorySystem.loadSession('test-session-2');
    console.log(`Loaded session: ${reloaded.sessionId}`);
    console.log(`Content: ${JSON.stringify(reloaded.sessionData)}`);
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMemorySystem();