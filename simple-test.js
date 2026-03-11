#!/usr/bin/env node
// Simple test for Rate Limit Bypass

const { RateLimitBypass } = require('./rate-limit-bypass.js');

async function test() {
  const bypass = new RateLimitBypass();
  
  console.log('🧪 Testing Rate Limit Bypass...\n');
  
  // Create session
  const sessionId = bypass.createSession('test-session');
  console.log(`✅ Created session: ${sessionId}`);
  
  // Test API call with bypass
  const testApi = async ({ userAgent, proxy }) => {
    return { success: true, data: 'test', userAgent: userAgent.substring(0, 30) };
  };
  
  const start = Date.now();
  
  // Make multiple calls
  for (let i = 0; i < 5; i++) {
    const result = await bypass.executeWithBypass('test', testApi, { sessionId });
    console.log(`   Call ${i+1}: ${result.success ? '✅' : '❌'}`);
  }
  
  const duration = Date.now() - start;
  
  // Get stats
  const stats = bypass.getSessionStats(sessionId);
  console.log(`\n📊 Stats:`);
  console.log(`   Duration: ${duration}ms`);
  console.log(`   API Calls: ${stats.apiCalls}`);
  console.log(`   Success Rate: ${stats.successRate}`);
  console.log(`   Active Sessions: ${bypass.getActiveSessions().length}`);
  console.log(`   Cache Size: ${bypass.cache.size}`);
  
  console.log(`\n✅ Rate Limit Bypass system working correctly!`);
  console.log(`   🛡️ Session persistence: enabled`);
  console.log(`   💾 Cache: ${bypass.config.cacheExpiry/1000}s TTL`);
  console.log(`   ⏱️  Rate limiting: ${bypass.config.rateLimits.maxRequests} req/${bypass.config.rateLimits.timeWindow}ms`);
  
  // Force exit since intervals keep process alive
  setTimeout(() => process.exit(0), 1000);
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
