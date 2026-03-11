#!/usr/bin/env node

/**
 * Rate Limit Bypass CLI - واجهة سطر الأوامر
 * لإدارة نظام تجاوز حدود الـ API
 */

const { RateLimitBypass } = require('./rate-limit-bypass.js');

// CLI arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const bypass = new RateLimitBypass();

const command = args[0];

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'create':
    handleCreate(args);
    break;
  case 'resume':
    handleResume(args);
    break;
  case 'list':
    handleList();
    break;
  case 'stats':
    handleStats();
    break;
  case 'clear':
    handleClear();
    break;
  case 'config':
    handleConfig();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.log(`⚠️  أمر غير معروف: ${command}`);
    showHelp();
    process.exit(1);
}

function showHelp() {
  console.log(`\n🛡️  Rate Limit Bypass CLI`);
  console.log(`==================================`);
  console.log(`📊 status        عرض حالة النظام`);
  console.log(`🗄️  create <name>    إنشاء جلسة جديدة`);
  console.log(`🔄 resume <id>      استئناف جلسة موجودة`);
  console.log(`📋 list          عرض الجلسات النشطة`);
  console.log(`📈 stats         عرض إحصائيات الجلسة`);
  console.log(`🧹 clear         حذف الجلسات المنتهية`);
  console.log(`⚙️  config         عرض/تعديل التكوين`);
  console.log(`❓ help           عرض المساعدة`);
  console.log(`\n📋 مثال على الاستخدام:`);
  console.log(`  node rate-limit-bypass-cli.js create profit-system`);
  console.log(`  node rate-limit-bypass-cli.js status`);
}

function showStatus() {
  const activeSessions = bypass.getActiveSessions();
  const sessionCount = activeSessions.length;
  
  console.log(`\n📊 حالة النظام:`);
  console.log(`   🔄 جلسات نشطة: ${sessionCount}`);
  console.log(`   📱 User Agents: ${bypass.config.userAgents.length}`);
  console.log(`   📝 Proxies: ${bypass.config.proxies.length || 'none'}`);
  console.log(`   ⏱️  Rate Limits: ${bypass.config.rateLimits.maxRequests} req/${bypass.config.rateLimits.timeWindow}ms`);
  console.log(`   📅 Cache: ${bypass.cache.size} items, ${bypass.config.cacheExpiry/1000}s expiry`);
  
  if (sessionCount > 0) {
    console.log(`\n📊 الجلسات النشطة:`);
    activeSessions.forEach((session, idx) => {
      console.log(`   ${idx + 1}. ${session.name} (${session.id.substring(0, 8)})`);
    });
  }
}

function handleCreate(args) {
  if (args.length < 2) {
    console.log(`⚠️  مطلوب: create <name>`);
    return;
  }

  const name = args[1];
  const sessionId = bypass.createSession(name);
  console.log(`✅ تم إنشاء الجلسة: ${name} (${sessionId})`);
}

function handleResume(args) {
  if (args.length < 2) {
    console.log(`⚠️  مطلوب: resume <id>`);
    return;
  }

  const sessionId = args[1];
  const success = bypass.resumeSession(sessionId);
  if (success) {
    console.log(`✅ تم استئناف الجلسة: ${sessionId}`);
  } else {
    console.log(`❌ لم يتم العثور على الجلسة: ${sessionId}`);
  }
}

function handleList() {
  const activeSessions = bypass.getActiveSessions();
  
  console.log(`\n📋 الجلسات النشطة (${activeSessions.length}):`);
  
  activeSessions.forEach((session, idx) => {
    console.log(`\n${idx + 1}. ${session.name}`);
    console.log(`   🔗 ID: ${session.id}`);
    console.log(`   🕒 Created: ${new Date(session.createdAt).toLocaleString()}`);
    console.log(`   🕐 Last Activity: ${new Date(session.lastActivity).toLocaleString()}`);
    console.log(`   📊 Data: ${Object.keys(session.data).length} items`);
  });
}

function handleStats() {
  const sessionId = bypass.activeSession;
  if (!sessionId) {
    console.log(`❌ لا توجد جلسة نشطة حالياً`);
    return;
  }

  const stats = bypass.getSessionStats(sessionId);
  if (!stats) {
    console.log(`❌ لم يتم العثور على الجلسة: ${sessionId}`);
    return;
  }

  console.log(`\n📈 إحصائيات الجلسة: ${stats.name}`);
  console.log(`   🔗 ID: ${stats.id}`);
  console.log(`   ⏱️  المدة: ${(stats.duration / 60000).toFixed(1)} دقيقة`);
  console.log(`   📱 API Calls: ${stats.apiCalls}`);
  console.log(`   ❌ Errors: ${stats.errors}`);
  console.log(`   ✅ Success Rate: ${stats.successRate}`);
  console.log(`   📅 Idle: ${(stats.idleTime / 1000).toFixed(1)}s`);
}

function handleClear() {
  const before = bypass.sessions.size;
  
  // Clear expired sessions
  const now = Date.now();
  bypass.sessions.forEach((session, id) => {
    if (now - session.lastActivity > bypass.config.sessionTimeout) {
      bypass.destroySession(id);
    }
  });
  
  const after = bypass.sessions.size;
  console.log(`🧹 تم تنظيف ${before - after} جلسة منتهية`);
}

function handleConfig() {
  console.log(`\n📋 التكوين الحالي:`);
  console.log(`   📱 User Agents: ${bypass.config.userAgents.length}`);
  console.log(`   📝 Proxies: ${bypass.config.proxies.length || 'none'}`);
  console.log(`   ⏱️  Rate Limits: ${bypass.config.rateLimits.maxRequests}/min`);
  console.log(`   📅 Session Timeout: ${bypass.config.sessionTimeout/3600000}h`);
  console.log(`   📄 Cache Expiry: ${bypass.config.cacheExpiry/1000}s`);
}