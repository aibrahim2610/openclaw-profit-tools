/**
 * OpenClaw Resilience & Timeout Manager
 * يحل مشاكل انقطاع LLM requests في الخلفية
 */

const EventEmitter = require('events');

class ResilienceManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.circuitBreakerTimeout = options.circuitBreakerTimeout || 30000;
    this.requestTimeout = options.requestTimeout || 30000;
    
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.isCircuitOpen = false;
    this.pendingRequests = new Map();
  }

  async executeWithRetry(operation, context = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    this.emit('request:start', { requestId, operation, context });
    
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitOpen && !this.isCircuitRecovered()) {
          throw new Error('Circuit breaker is OPEN - skipping request');
        }
        
        // Set timeout for this attempt
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Request timeout after ${this.requestTimeout}ms`)), this.requestTimeout);
        });
        
        // Execute with timeout
        const result = await Promise.race([
          operation(),
          timeoutPromise
        ]);
        
        // Success - reset failure count
        this.onSuccess();
        const duration = Date.now() - startTime;
        this.emit('request:success', { requestId, attempt, duration });
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.onFailure();
        
        this.emit('request:retry', { requestId, attempt, error: error.message });
        
        // Don't retry if it's a circuit breaker or auth error
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        // Wait before retry (with backoff)
        if (attempt < this.maxRetries) {
          await this.delay(Math.min(this.retryDelay * Math.pow(2, attempt - 1), 10000));
        }
      }
    }
    
    // All retries failed
    this.emit('request:failure', { requestId, attempts: this.maxRetries, error: lastError.message });
    throw lastError;
  }

  onSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.isCircuitOpen = false;
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Open circuit breaker if threshold exceeded
    if (this.failureCount >= this.circuitBreakerThreshold) {
      this.isCircuitOpen = true;
      this.emit('circuit:open', { failureCount: this.failureCount });
    }
  }

  isCircuitRecovered() {
    if (!this.lastFailureTime) return true;
    const timeSinceFailure = Date.now() - this.lastFailureTime;
    return timeSinceFailure > this.circuitBreakerTimeout;
  }

  isNonRetryableError(error) {
    const nonRetryable = [
      'AUTHENTICATION_FAILED',
      'RATE_LIMITED',
      'INVALID_REQUEST',
      'UNAUTHORIZED',
      'FORBIDDEN'
    ];
    
    const errorMsg = error.message || error.code || '';
    return nonRetryable.some(code => errorMsg.includes(code));
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get health status
  getHealthStatus() {
    return {
      failureCount: this.failureCount,
      isCircuitOpen: this.isCircuitOpen,
      lastFailureTime: this.lastFailureTime,
      uptime: this.isCircuitRecovered() ? 'healthy' : 'degraded'
    };
  }

  // Reset circuit breaker manually
  reset() {
    this.onSuccess();
    this.emit('circuit:reset');
  }
}

/**
 * Background Job Manager with heartbeat
 */
class BackgroundJobManager extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.isRunning = false;
    this.heartbeatInterval = null;
  }

  startJob(name, fn, intervalMs, options = {}) {
    if (this.jobs.has(name)) {
      throw new Error(`Job ${name} already exists`);
    }

    const job = {
      name,
      fn,
      intervalMs,
      options,
      lastRun: null,
      nextRun: Date.now(),
      failures: 0,
      isRunning: false
    };

    this.jobs.set(name, job);
    this.scheduleJob(name);
    
    // Start heartbeat if first job
    if (this.jobs.size === 1) {
      this.startHeartbeat();
    }
    
    this.emit('job:added', { name, intervalMs });
  }

  scheduleJob(name) {
    const job = this.jobs.get(name);
    if (!job) return;

    const now = Date.now();
    const time untilNext = Math.max(0, job.nextRun - now);
    
    setTimeout(() => this.runJob(name), untilNext);
  }

  async runJob(name) {
    const job = this.jobs.get(name);
    if (!job || job.isRunning) return;

    job.isRunning = true;
    job.lastRun = Date.now();
    
    const startTime = Date.now();
    
    try {
      this.emit('job:start', { name, timestamp: startTime });
      
      await job.fn();
      
      job.failures = 0;
      const duration = Date.now() - startTime;
      this.emit('job:success', { name, duration });
      
    } catch (error) {
      job.failures++;
      this.emit('job:failure', { name, error: error.message, failures: job.failures });
      
      // Disable job if too many failures
      if (job.failures >= 5) {
        this.emit('job:disabled', { name, reason: 'Too many failures' });
        return;
      }
    } finally {
      job.isRunning = false;
      job.nextRun = Date.now() + job.intervalMs;
      this.scheduleJob(name);
    }
  }

  startHeartbeat() {
    this.isRunning = true;
    this.heartbeatInterval = setInterval(() => {
      this.emit('heartbeat', {
        timestamp: Date.now(),
        activeJobs: Array.from(this.jobs.keys()),
        totalJobs: this.jobs.size
      });
    }, 60000); // Every minute
  }

  stop() {
    this.isRunning = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.jobs.clear();
  }
}

/**
 * Main OpenClaw Wrapper with Resilience
 */
class OpenClawResilientWrapper {
  constructor() {
    this.resilience = new ResilienceManager({
      maxRetries: 3,
      retryDelay: 2000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      requestTimeout: 30000
    });
    
    this.jobManager = new BackgroundJobManager();
    this.setupJobMonitoring();
  }

  setupJobMonitoring() {
    this.resilience.on('circuit:open', () => {
      console.log('⚠️  Circuit breaker OPEN - LLM requests paused');
    });

    this.resilience.on('circuit:reset', () => {
      console.log('✅ Circuit breaker reset - LLM requests resumed');
    });

    this.resilience.on('request:retry', ({ requestId, attempt, error }) => {
      console.log(`🔄 Request ${requestId}: retry ${attempt} due to: ${error}`);
    });

    this.resilience.on('request:failure', ({ requestId, attempts, error }) => {
      console.log(`❌ Request ${requestId} failed after ${attempts} attempts: ${error}`);
    });
  }

  wrapOpenClawAgent(agent) {
    const originalOnMessage = agent.onMessage.bind(agent);
    
    agent.onMessage = async function(message) {
      return this.resilience.executeWithRetry(async () = > {
        return await originalOnMessage(message);
      }, { agent: agent.constructor.name, messageType: message.type });
    };
    
    return agent;
  }

  startHealthCheckInterval() {
    setInterval(() = > {
      const status = this.resilience.getHealthStatus();
      console.log(`\n🩺 Health Check [${new Date().toISOString()}]`);
      console.log(`   Circuit: ${status.isCircuitOpen ? '🔴 OPEN' : '🟢 CLOSED'}`);
      console.log(`   Failures: ${status.failureCount}`);
      console.log(`   Status: ${status.uptime}\n`);
    }, 300000); // Every 5 minutes
  }
}

module.exports = {
  ResilienceManager,
  BackgroundJobManager,
  OpenClawResilientWrapper
};