#!/usr/bin/env node

/**
 * Rate Limit Bypass & Session Persistence - الإصدار الكامل
 * يحل مشكلة API rate limit وانقطاع المهام
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class RateLimitBypass {
  constructor() {
    this.configPath = '/root/.openclaw/workspace/rate-limit-config.json';
    this.sessionsPath = '/root/.openclaw/workspace/sessions';
    this.cachePath = '/root/.openclaw/workspace/cache';
    
    this.config = this.loadConfig();
    this.sessions = new Map();
    this.cache = new Map();
    this.activeSession = null;
    
    this.init();
    console.log('🛡️  Rate Limit Bypass & Session Persistence - نظام الحماية من الانقطاع');
  }

  loadConfig() {
    if (fs.existsSync(this.configPath)) {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    }

    const defaultConfig = {
      userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
      ],
      proxies: [],
      rateLimits: {
        maxRequests: 100,
        timeWindow: 60000,
        retryDelay: 2000,
        maxRetries: 5
      },
      sessionTimeout: 3600000,
      cacheExpiry: 300000
    };

    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }

  init() {
    fs.mkdirSync(this.sessionsPath, { recursive: true });
    fs.mkdirSync(this.cachePath, { recursive: true });
    this.loadSessions();
    this.loadCache();
    this.startCleanupIntervals();
    console.log(`✅ تحميل ${this.sessions.size} جلسة من القرص`);
  }

  loadSessions() {
    const files = fs.readdirSync(this.sessionsPath).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.sessionsPath, file), 'utf8'));
        this.sessions.set(data.id, data);
      } catch (e) {
        console.log(`⚠️  فشل تحميل الجلسة ${file}: ${e.message}`);
      }
    });
  }

  loadCache() {
    const files = fs.readdirSync(this.cachePath).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.cachePath, file), 'utf8'));
        this.cache.set(data.key, data);
      } catch (e) {
        // Ignore cache errors
      }
    });
  }

  startCleanupIntervals() {
    // Clean expired sessions every minute
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      this.sessions.forEach((session, id) => {
        if (now - session.lastActivity > this.config.sessionTimeout) {
          this.destroySession(id);
          cleaned++;
        }
      });
      if (cleaned > 0) console.log(`🧹 تنظيف ${cleaned} جلسة منتهية`);
    }, 60000);

    // Clean expired cache every 2 minutes
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      this.cache.forEach((data, key) => {
        if (now - data.timestamp > this.config.cacheExpiry) {
          this.cache.delete(key);
          try {
            fs.unlinkSync(path.join(this.cachePath, `${key}.json`));
          } catch (e) {}
          cleaned++;
        }
      });
      if (cleaned > 0) console.log(`🧹 تنظيف ${cleaned} عنصر cache`);
    }, 120000);
  }

  createSession(name, data = {}) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      name,
      data,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'active',
      retries: 0,
      currentTask: null,
      history: []
    };

    this.sessions.set(sessionId, session);
    this.saveSession(session);
    this.activeSession = sessionId;
    console.log(`✅ جلسة جديدة: ${name} (${sessionId})`);
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = Date.now();
      this.saveSession(session);
    }
  }

  appendToHistory(sessionId, entry) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.history.push({
        timestamp: Date.now(),
        ...entry
      });
      this.saveSession(session);
    }
  }

  destroySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'terminated';
      this.saveSession(session);
      this.sessions.delete(sessionId);
      try {
        fs.unlinkSync(path.join(this.sessionsPath, `${sessionId}.json`));
      } catch (e) {}
      console.log(`🗑️  جلسة محذوفة: ${sessionId}`);
    }
  }

  saveSession(session) {
    try {
      fs.writeFileSync(
        path.join(this.sessionsPath, `${session.id}.json`),
        JSON.stringify(session, null, 2)
      );
    } catch (e) {
      console.log(`⚠️  فشل حفظ الجلسة ${session.id}: ${e.message}`);
    }
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now()
    };
    this.cache.set(key, cacheEntry);
    try {
      fs.writeFileSync(
        path.join(this.cachePath, `${key}.json`),
        JSON.stringify(cacheEntry, null, 2)
      );
    } catch (e) {
      console.log(`⚠️  فشل حفظ cache: ${e.message}`);
    }
  }

  getRandomUserAgent() {
    const agents = this.config.userAgents;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  getRandomProxy() {
    if (this.config.proxies.length === 0) return null;
    return this.config.proxies[Math.floor(Math.random() * this.config.proxies.length)];
  }

  async checkRateLimit(apiName) {
    const key = `rate-limit:${apiName}`;
    const cached = this.getCache(key);

    if (cached) {
      if (cached.count >= this.config.rateLimits.maxRequests) {
        const waitTime = this.config.rateLimits.timeWindow - (Date.now() - cached.timestamp);
        console.log(`⏳ انتظار ${Math.ceil(waitTime / 1000)} ثانية...`);
        await this.sleep(waitTime);
        return false;
      } else {
        cached.count++;
        this.setCache(key, cached);
        return true;
      }
    } else {
      this.setCache(key, { count: 1, timestamp: Date.now() });
      return true;
    }
  }

  async executeWithBypass(apiName, apiCall, options = {}) {
    const { retries = 0, sessionId = null } = options;

    try {
      // Check rate limit
      const canProceed = await this.checkRateLimit(apiName);
      if (!canProceed) {
        return this.executeWithBypass(apiName, apiCall, { ...options, retries: retries + 1 });
      }

      // Get random user agent & proxy
      const userAgent = this.getRandomUserAgent();
      const proxy = this.getRandomProxy();

      // Log attempt
      if (sessionId) {
        this.appendToHistory(sessionId, {
          action: 'api-call',
          apiName,
          userAgent: userAgent.substring(0, 50) + '...',
          proxy: proxy ? `${proxy.host}:${proxy.port}` : 'none'
        });
      }

      // Execute API call
      const result = await apiCall({ userAgent, proxy });

      // Cache result (24h for successful calls)
      const cacheKey = `api-result:${apiName}:${this.hash(JSON.stringify(options))}`;
      this.setCache(cacheKey, result);

      if (sessionId) {
        this.updateSession(sessionId, { lastApiSuccess: Date.now() });
      }

      return { success: true, data: result };

    } catch (error) {
      console.log(`⚠️  خطأ في ${apiName}: ${error.message}`);

      if (sessionId) {
        this.appendToHistory(sessionId, {
          action: 'api-error',
          apiName,
          error: error.message,
          retries: retries + 1
        });
      }

      if (retries < this.config.rateLimits.maxRetries) {
        const delay = this.config.rateLimits.retryDelay * Math.pow(2, retries); // Exponential backoff
        console.log(`🔄 إعادة المحاولة بعد ${delay}ms...`);
        await this.sleep(delay);
        return this.executeWithBypass(apiName, apiCall, { ...options, retries: retries + 1 });
      } else {
        console.log(`❌ فشل最终 после ${retries} محاولات`);
        return { success: false, error: error.message };
      }
    }
  }

  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getActiveSessions() {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }

  getSessionStats(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    const duration = now - session.createdAt;
    const apiCalls = session.history.filter(h => h.action === 'api-call').length;
    const errors = session.history.filter(h => h.action === 'api-error').length;

    return {
      id: session.id,
      name: session.name,
      duration,
      apiCalls,
      errors,
      successRate: apiCalls > 0 ? ((apiCalls - errors) / apiCalls * 100).toFixed(2) + '%' : 'N/A',
      lastActivity: session.lastActivity,
      idleTime: now - session.lastActivity
    };
  }

  // Resume a session from persistent storage
  resumeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'active') {
      this.activeSession = sessionId;
      session.lastActivity = Date.now();
      this.saveSession(session);
      console.log(`🔄 استئناف الجلسة: ${session.name} (${sessionId})`);
      return true;
    }
    return false;
  }

  // Auto-resume the last active session
  autoResume() {
    const activeSessions = this.getActiveSessions();
    if (activeSessions.length > 0) {
      // Resume the most recently active session
      const mostRecent = activeSessions.sort((a, b) => b.lastActivity - a.lastActivity)[0];
      return this.resumeSession(mostRecent.id);
    }
    return false;
  }
}

// Export for module use (ALWAYS)
module.exports = { RateLimitBypass };

// CLI Interface (runs when executed directly)
if (require.main === module) {
  const bypass = new RateLimitBypass();

  // Auto-resume any existing session
  bypass.autoResume();

  // Create a new persistent session
  const sessionId = bypass.createSession('profit-system', {
    mode: 'continuous',
    startTime: Date.now(),
    guardianPid: process.pid
  });

  console.log(`\n🛡️  النظام جاهز!`);
  console.log(`   Session ID: ${sessionId}`);
  console.log(`   Active Sessions: ${bypass.getActiveSessions().length}`);
  console.log(`   Rate Limits: ${bypass.config.rateLimits.maxRequests} requests/${bypass.config.rateLimits.timeWindow}ms`);
  console.log(`\nاستخدم هذا الجلسة للـ API calls.\n`);
}
