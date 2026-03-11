#!/usr/bin/env node

/**
 * Dark Web Scanner System
 * Scans dark web for data breaches, collects information about leaks and their owners,
 * then contacts them to offer remediation services for a fee
 */

import express from 'express';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Dark web sources
  darkWebSources: {
    onionSites: [
      'http://3g2upl4pq6kufc4m.onion', // DuckDuckGo dark web
      'http://zqktlwi4fecvo6ri.onion', // The Hidden Wiki
      'http://xmh57jrzrnw6insl.onion', // Torch search engine
      'http://oniondir.biz', // Onion directory
      'http://grams7enufi7jmdl.onion' // Grams search engine
    ],
    
    darkWebForums: [
      'http://forums24hdv6l.onion', // Dark web forums
      'http://leakforums.biz', // Leak forums
      'http://pastebin.onion' // Pastebin dark web
    ],
    
    monitoringSites: [
      'https://haveibeenpwned.com/api/v3/breaches',
      'https://api.fraudwatch.com/v1/leaks'
    ]
  },
  
  // Types of data to look for
  dataTypes: [
    'credit_card', // Visa, Mastercard, Amex
    'email',      // Email addresses
    'password',  // Passwords
    'ssn',        // Social Security Numbers
    'phone',      // Phone numbers
    'address',    // Physical addresses
    'username',   // Usernames
    'ip_address'  // IP addresses
  ],
  
  // Scanning parameters
  scanParameters: {
    interval: '0 */6 * * *', // Every 6 hours
    maxPages: 10,
    timeout: 30000, // 30 seconds
    maxRetries: 3
  },
  
  // Revenue model
  revenue: {
    basePrice: 199, // Base price for remediation
    pricePerRecord: 5, // Additional price per record found
    discount: 0.10, // 10% discount for early response
    payoutThreshold: 100
  },
  
  // Security
  security: {
    maxConcurrentRequests: 5,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timeout: 30000,
    retries: 3
  }
};

// ==================== STATE ====================
const state = {
  totalLeaksFound: 0,
  totalRecords: 0,
  totalRevenue: 0,
  pendingNotifications: [],
  scanning: false,
  startTime: Date.now(),
  leaks: [], // Array of leak objects
  
  // Statistics
  stats: {
    byDataType: new Map(),
    bySeverity: new Map(),
    bySource: new Map()
  }
};

// ==================== UTILITIES ====================
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const formatted = chalk[level](\`[${timestamp}] \${message}\`);
  console.log(formatted);
  
  // Also log to file
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(path.join(logDir, 'dark-web-scanner.log'), \`[${timestamp}] \${level.toUpperCase()}: \${message}\n\`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeInput(input) {
  // Basic sanitization for security
  return input.replace(/[<>]/g, '');
}

// ==================== SCANNING FUNCTIONS ====================

async function scanOnionSite(url) {
  try {
    log(\`Scanning onion site: \${url}\`, 'info');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(CONFIG.security.userAgent);
    
    try {
      await page.goto(url, { timeout: CONFIG.security.timeout });
      
      // Wait for page to load
      await page.waitForSelector('body', { timeout: 10000 });
      
      const html = await page.content();
      const leaks = extractLeaksFromHTML(html, url);
      
      if (leaks.length > 0) {
        log(\`Found \${leaks.length} potential leaks on \${url}\`, 'success');
        return leaks;
      }
      
    } catch (error) {
      log(\`Error scanning \${url}: \${error.message}\`, 'warn');
    } finally {
      await browser.close();
    }
    
  } catch (error) {
    log(\`Error launching browser for \${url}: \${error.message}\`, 'error');
  }
  
  return [];
}

async function scanPublicAPI(apiUrl) {
  try {
    log(\`Scanning public API: \${apiUrl}\`, 'info');
    
    const response = await axios.get(apiUrl, {
      timeout: CONFIG.security.timeout
    });
    
    if (response.status === 200) {
      const data = response.data;
      const leaks = extractLeaksFromAPI(data, apiUrl);
      
      if (leaks.length > 0) {
        log(\`Found \${leaks.length} leaks from \${apiUrl}\`, 'success');
        return leaks;
      }
    }
    
  } catch (error) {
    log(\`Error scanning \${apiUrl}: \${error.message}\`, 'warn');
  }
  
  return [];
}

function extractLeaksFromHTML(html, sourceUrl) {
  const leaks = [];
  
  // Simple regex patterns for common data types
  // Note: This is a basic example, real implementation would be more sophisticated
  
  const patterns = {
    creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11})\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    password: /(?:[A-Za-z0-9!@#$%^&*()_+{}\\\[\\]|;:'\",.<>/?-]{6,})\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    phone: /\b\d{3}-\d{3}-\d{4}\b/g,
    username: /\b[A-Za-z0-9_]{3,}\b/g
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      leaks.push({
        type,
        value: match[0],
        source: sourceUrl,
        foundAt: match.index,
        severity: getSeverity(type),
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return leaks;
}

function extractLeaksFromAPI(data, sourceUrl) {
  const leaks = [];
  
  // Process API data based on its structure
  // This is a simplified example
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item.email) {
        leaks.push({
          type: 'email',
          value: item.email,
          source: sourceUrl,
          severity: getSeverity('email'),
          timestamp: new Date().toISOString(),
          additionalInfo: item
        });
      }
      
      if (item.password) {
        leaks.push({
          type: 'password',
          value: item.password,
          source: sourceUrl,
          severity: getSeverity('password'),
          timestamp: new Date().toISOString(),
          additionalInfo: item
        });
      }
    });
  }
  
  return leaks;
}

function getSeverity(dataType) {
  const severityMap = {
    creditCard: 'high',
    ssn: 'high',
    password: 'high',
    email: 'medium',
    phone: 'medium',
    username: 'low',
    ip_address: 'medium'
  };
  
  return severityMap[dataType] || 'low';
}

// ==================== NOTIFICATION FUNCTIONS ====================

async function notifyOwner(leak) {
  try {
    log(\`Notifying owner of leak: \${leak.value}\`, 'info');
    
    // Extract owner information from leak
    const ownerInfo = await extractOwnerInfo(leak);
    
    if (!ownerInfo) {
      log(\`Could not extract owner info for \${leak.value}\`, 'warn');
      return false;
    }
    
    // Prepare notification
    const notification = {
      leakId: leak.id,
      ownerInfo,
      leakDetails: leak,
      message: generateNotificationMessage(leak, ownerInfo),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    state.pendingNotifications.push(notification);
    
    // Save to file
    saveNotification(notification);
    
    log(\`Notification prepared for \${leak.value}\`, 'success');
    return true;
    
  } catch (error) {
    log(\`Error notifying owner: \${error.message}\`, 'error');
    return false;
  }
}

async function extractOwnerInfo(leak) {
  try {
    // This would extract owner info from leak data
    // For now, return dummy data
    
    const email = leak.value.includes('@') ? leak.value : null;
    const domain = email ? email.split('@')[1] : null;
    
    return {
      email: email,
      domain: domain,
      name: domain ? domain.split('.')[0] : 'Unknown',
      contactMethod: 'email',
      severity: leak.severity
    };
    
  } catch (error) {
    log(\`Error extracting owner info: \${error.message}\`, 'error');
    return null;
  }
}

function generateNotificationMessage(leak, ownerInfo) {
  return \`Dear \${ownerInfo.name || 'Owner'},\n\nWe have detected a potential data breach involving your information:\n\n- Data Type: \${leak.type}\n- Value: \${leak.value}\n- Source: \${leak.source}\n- Severity: \${leak.severity}\n\nThis information may be available on the dark web and could be used for malicious purposes.\n\nWe offer professional data breach remediation services:\n\n\u2022 Secure data removal from dark web sources\n\u2022 Credit monitoring and protection\n\u2022 Identity theft prevention\n\u2022 Legal documentation and support\n\nOur base price is \$${CONFIG.revenue.basePrice}, with additional charges of \$${CONFIG.revenue.pricePerRecord} per record found.\n\nContact us immediately to secure your information and prevent potential damage.\n\nBest regards,\nGuardian-AI Cybersecurity Team\`;
}

function saveNotification(notification) {
  const notificationsDir = path.join(process.cwd(), 'notifications');
  if (!fs.existsSync(notificationsDir)) {
    fs.mkdirSync(notificationsDir, { recursive: true });
  }
  
  const filename = \`notification_\${notification.leakId}.json\`;
  fs.writeFileSync(path.join(notificationsDir, filename), JSON.stringify(notification, null, 2));
}

// ==================== SCANNING TASK ====================

async function scanForLeaks() {
  if (state.scanning) {
    log('Scan already in progress, skipping...', 'warn');
    return;
  }
  
  state.scanning = true;
  
  try {
    log('Starting dark web scan...', 'info');
    
    const allLeaks = [];
    
    // 1. Scan onion sites
    for (const site of CONFIG.darkWebSources.onionSites) {
      const leaks = await scanOnionSite(site);
      allLeaks.push(...leaks);
      await sleep(5000); // Be gentle with requests
    }
    
    // 2. Scan public APIs
    for (const api of CONFIG.darkWebSources.monitoringSites) {
      const leaks = await scanPublicAPI(api);
      allLeaks.push(...leaks);
      await sleep(5000); // Be gentle with requests
    }
    
    // 3. Process leaks
    if (allLeaks.length > 0) {
      log(\`Found \${allLeaks.length} potential leaks\`, 'success');
      
      allLeaks.forEach(leak => {
        leak.id = uuidv4();
        state.leaks.push(leak);
        state.totalLeaksFound++;
        state.totalRecords++;
        
        // Update statistics
        state.stats.byDataType.set(leak.type, (state.stats.byDataType.get(leak.type) || 0) + 1);
        state.stats.bySeverity.set(leak.severity, (state.stats.bySeverity.get(leak.severity) || 0) + 1);
        state.stats.bySource.set(leak.source, (state.stats.bySource.get(leak.source) || 0) + 1);
        
        // Notify owner
        notifyOwner(leak);
      });
      
      // Calculate revenue
      const revenue = allLeaks.length * CONFIG.revenue.pricePerRecord + CONFIG.revenue.basePrice;
      state.totalRevenue += revenue;
      
      log(\`Estimated revenue: \$${revenue.toFixed(2)}\`, 'success');
      
    } else {
      log('No leaks found in this scan cycle', 'info');
    }
    
    // Save state
    saveState();
    
  } catch (error) {
    log(\`Error during scan: \${error.message}\`, 'error');
  } finally {
    state.scanning = false;
  }
}

function saveState() {
  const stateDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(stateDir, 'state.json'), JSON.stringify({
    totalLeaksFound: state.totalLeaksFound,
    totalRecords: state.totalRecords,
    totalRevenue: state.totalRevenue,
    pendingNotifications: state.pendingNotifications.length,
    stats: state.stats,
    timestamp: new Date().toISOString()
  }, null, 2));
}

// ==================== API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    totalLeaksFound: state.totalLeaksFound,
    totalRecords: state.totalRecords,
    totalRevenue: state.totalRevenue,
    scanning: state.scanning,
    pendingNotifications: state.pendingNotifications.length,
    timestamp: new Date().toISOString()
  });
});

// Start scan
app.post('/scan/start', (req, res) => {
  scanForLeaks();
  res.json({ success: true, message: 'Scan started' });
});

// Get leak statistics
app.get('/stats', (req, res) => {
  res.json({
    totalLeaksFound: state.totalLeaksFound,
    totalRecords: state.totalRecords,
    totalRevenue: state.totalRevenue,
    stats: state.stats,
    lastScan: state.startTime
  });
});

// Get pending notifications
app.get('/notifications', (req, res) => {
  res.json({
    total: state.pendingNotifications.length,
    notifications: state.pendingNotifications.slice(-10)
  });
});

// ====================