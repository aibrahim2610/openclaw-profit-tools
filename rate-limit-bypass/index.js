#!/usr/bin/env node

/**
 * Rate Limit Bypass System
 * Free, open-source tool to bypass API rate limits using proxy rotation and token pooling
 */

import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());

// ==================== CONFIGURATION ====================
const CONFIG = {
  // OpenRouter (free tier available)
  openrouter: {
    apiKeys: [
      process.env.OPENROUTER_API_KEY || 'sk-or-v1-free-demo-key',
      // Add more keys for better distribution
    ],
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-3.5-turbo', 'anthropic/claude-3-haiku', 'google/gemini-pro']
  },
  
  // Rotation strategy
  rotation: {
    strategy: 'round-robin', // round-robin, random, weighted
    proxyEnabled: false, // Set to true if using proxies
    proxies: [] // List of proxy URLs
  },
  
  // Rate limiting per key
  keyLimits: [
    { key: 0, maxRequests: 100, windowMs: 60000, used: 0, resetTime: Date.now() },
    // More keys...
  ],
  
  // Logging
  logging: {
    enabled: true,
    file: './logs/bypass.log'
  }
};

// ==================== STATE ====================
const state = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  keyUsage: new Map(), // keyIndex -> { count, lastUsed }
  startTime: Date.now()
};

// Ensure logs directory exists
if (CONFIG.logging.enabled) {
  const logDir = path.dirname(CONFIG.logging.file);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// ==================== UTILITIES ====================
function getNextKeyIndex() {
  // Round-robin: find the least used key
  let minIndex = 0;
  let minUsage = Infinity;
  
  for (let i = 0; i < CONFIG.openrouter.apiKeys.length; i++) {
    const usage = state.keyUsage.get(i)?.count || 0;
    if (usage < minUsage) {
      minUsage = usage;
      minIndex = i;
    }
  }
  
  return minIndex;
}

function isKeyRateLimited(keyIndex) {
  const limit = CONFIG.keyLimits[keyIndex];
  if (!limit) return false;
  
  if (Date.now() > limit.resetTime) {
    // Reset the counter
    limit.used = 0;
    limit.resetTime = Date.now() + limit.windowMs;
    return false;
  }
  
  return limit.used >= limit.maxRequests;
}

function logRequest(req, res, keyIndex, error = null) {
  if (!CONFIG.logging.enabled) return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    keyIndex,
    statusCode: res.statusCode,
    error: error?.message,
    userId: req.headers['x-user-id']
  };
  
  fs.appendFileSync(
    CONFIG.logging.file,
    JSON.stringify(logEntry) + '\n'
  );
}

// ==================== MIDDLEWARE ====================
app.use((req, res, next) => {
  state.totalRequests++;
  next();
});

// ==================== API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    totalRequests: state.totalRequests,
    successRate: state.totalRequests > 0 
      ? ((state.successfulRequests / state.totalRequests) * 100).toFixed(2) + '%'
      : 'N/A',
    activeKeys: CONFIG.openrouter.apiKeys.length,
    keyUsage: Array.from(state.keyUsage.entries()).map(([key, usage]) => ({
      keyIndex: key,
      used: usage.count,
      lastUsed: usage.lastUsed
    }))
  });
});

// Proxy endpoint for OpenAI-compatible APIs
app.post('/v1/chat/completions', async (req, res) => {
  const userKeyIndex = getNextKeyIndex();
  
  // Check rate limit
  if (isKeyRateLimited(userKeyIndex)) {
    state.failedRequests++;
    logRequest(req, res, userKeyIndex, new Error('Rate limited'));
    return res.status(429).json({
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60
    });
  }
  
  const apiKey = CONFIG.openrouter.apiKeys[userKeyIndex];
  if (!apiKey) {
    state.failedRequests++;
    logRequest(req, res, userKeyIndex, new Error('No API key available'));
    return res.status(503).json({ error: 'No API keys configured' });
  }
  
  try {
    // Increment usage
    state.keyUsage.set(userKeyIndex, {
      count: (state.keyUsage.get(userKeyIndex)?.count || 0) + 1,
      lastUsed: Date.now()
    });
    
    // Update rate limit tracking
    const limit = CONFIG.keyLimits[userKeyIndex];
    if (limit) {
      limit.used++;
    }
    
    // Forward request to OpenRouter
    const response = await fetch(`${CONFIG.openrouter.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://guardian-ai.example.com',
        'X-Title': 'Guardian-AI Rate Limit Bypass'
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      state.successfulRequests++;
      res.json(data);
    } else {
      state.failedRequests++;
      logRequest(req, res, userKeyIndex, new Error(`API error: ${response.status}`));
      res.status(response.status).json(data);
    }
  } catch (error) {
    state.failedRequests++;
    logRequest(req, res, userKeyIndex, error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Proxy for other OpenAI endpoints
app.post('/v1/completions', async (req, res) => {
  // Similar to chat/completions but for completions endpoint
  // Implementation similar to above...
  res.status(501).json({ error: 'Not implemented yet' });
});

// List available models
app.get('/v1/models', async (req, res) => {
  const apiKey = CONFIG.openrouter.apiKeys[0]; // Use first key for metadata
  
  try {
    const response = await fetch(`${CONFIG.openrouter.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.SITE_URL || 'https://guardian-ai.example.com',
        'X-Title': 'Guardian-AI Rate Limit Bypass'
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Usage statistics (admin only, simple auth)
app.get('/admin/stats', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_SECRET || 'admin-secret'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const uptimeHours = (state.startTime - Date.now()) / (1000 * 60 * 60);
  
  res.json({
    totalRequests: state.totalRequests,
    successfulRequests: state.successfulRequests,
    failedRequests: state.failedRequests,
    successRate: state.totalRequests > 0 
      ? ((state.successfulRequests / state.totalRequests) * 100).toFixed(2) + '%'
      : '0%',
    uptimeHours: uptimeHours.toFixed(2),
    keyUsage: Array.from(state.keyUsage.entries()).map(([key, usage]) => ({
      keyIndex: key,
      used: usage.count,
      lastUsed: new Date(usage.lastUsed).toISOString()
    })),
    config: {
      totalKeys: CONFIG.openrouter.apiKeys.length,
      rotationStrategy: CONFIG.rotation.strategy,
      proxyEnabled: CONFIG.rotation.proxyEnabled
    }
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n⚡ Rate Limit Bypass System Started`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔑 API Keys configured: ${CONFIG.openrouter.apiKeys.length}`);
  console.log(`🔄 Rotation strategy: ${CONFIG.rotation.strategy}`);
  console.log(`📊 Rate limits per key: ${CONFIG.keyLimits.length} configured`);
  console.log(`📝 Logging: ${CONFIG.logging.enabled ? 'enabled' : 'disabled'}`);
  console.log(`\n📖 API Endpoints:`);
  console.log(`   GET  /health - System health`);
  console.log(`   POST /v1/chat/completions - Proxy chat completions`);
  console.log(`   GET  /v1/models - List available models`);
  console.log(`   GET  /admin/stats - Admin statistics (requires ADMIN_SECRET)`);
  console.log(`\n💡 Usage:`);
  console.log(`   Set your application's OpenAI API base to: http://localhost:${PORT}/v1`);
  console.log(`   Set your OpenAI API key to: any-value (not used)`);
  console.log(`   The system will route through OpenRouter with key rotation.`);
});
