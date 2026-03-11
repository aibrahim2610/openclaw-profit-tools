#!/usr/bin/env node

/**
 * OpenRouter API Reseller System
 * Fully automated - no Stripe needed initially (uses OpenRouter free tier)
 * Future: integrate Stripe for real payments
 */

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// ==================== CONFIGURATION ====================
const CONFIG = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: 'https://openrouter.ai/api/v1',
    freeTierEnabled: true,
    creditPricePerDollar: 0.095, // $0.095 per credit (OpenRouter bulk price)
    sellPricePerCredit: 0.10, // $0.10 per credit (our margin)
    minPurchase: 1,
    maxPurchase: 1000
  },
  profit: {
    marginPercent: 5, // 5% profit margin
    payoutThreshold: 50, // $50 before payout
    autoPayout: false
  },
  server: {
    secretKey: process.env.SERVER_SECRET || 'change-me-in-production',
    webhookSecret: process_env.STRIPE_WEBHOOK_SECRET || '' // Future: Stripe integration
  }
};

// ==================== DATABASE (in-memory for demo) ====================
const db = {
  users: new Map(), // userId -> { credits, email, purchased }
  transactions: [],
  revenue: {
    totalEarned: 0,
    pendingPayout: 0,
    lastPayout: null
  }
};

// ==================== UTILITY FUNCTIONS ====================
function calculateProfit(purchaseAmount) {
  const cost = purchaseAmount * CONFIG.openrouter.creditPricePerDollar;
  const revenue = purchaseAmount * CONFIG.openrouter.sellPricePerCredit;
  const profit = revenue - cost;
  return { cost, revenue, profit };
}

async function callOpenRouterAPI(endpoint, method = 'GET', body = null) {
  const headers = {
    'Authorization': `Bearer ${CONFIG.openrouter.apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.SITE_URL || 'https://guardian-ai.example.com',
    'X-Title': 'Guardian-AI Reseller'
  };

  const response = await fetch(`${CONFIG.openrouter.baseUrl}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  return response.json();
}

// ==================== API ROUTES ====================

// 1. Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 2. Pricing Info
app.get('/api/pricing', (req, res) => {
  res.json({
    creditPrice: CONFIG.openrouter.sellPricePerCredit,
    minPurchase: CONFIG.openrouter.minPurchase,
    maxPurchase: CONFIG.openrouter.maxPurchase,
    currency: 'USD',
    availableModels: ['gpt-4', 'claude-3', 'gemini-pro'] // Placeholder
  });
});

// 3. Check User Balance
app.get('/api/balance/:userId', (req, res) => {
  const user = db.users.get(req.params.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    userId: user.userId,
    credits: user.credits,
    email: user.email,
    totalPurchased: user.purchased
  });
});

// 4. Purchase Credits (Free Demo - no payment required)
app.post('/api/purchase', async (req, res) => {
  const { userId, email, amount } = req.body;

  // Validation
  if (!userId || !email || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (amount < CONFIG.openrouter.minPurchase || amount > CONFIG.openrouter.maxPurchase) {
    return res.status(400).json({ 
      error: `Amount must be between ${CONFIG.openrouter.minPurchase} and ${CONFIG.openrouter.maxPurchase}` 
    });
  }

  // In free demo mode: grant credits without payment
  // In production: integrate Stripe Checkout here
  const user = db.users.get(userId) || { userId, credits: 0, purchased: 0, email };
  
  const creditsToAdd = amount; // 1 credit = $0.10
  
  user.credits += creditsToAdd;
  user.purchased += amount;
  db.users.set(userId, user);

  const profit = calculateProfit(amount);
  
  // Record transaction
  const transaction = {
    id: `tx_${Date.now()}`,
    userId,
    amount,
    credits: creditsToAdd,
    profit: profit.profit,
    timestamp: new Date().toISOString(),
    status: 'completed',
    paymentMethod: 'free_demo' // Change to 'stripe' when integrated
  };
  db.transactions.push(transaction);

  // Update revenue
  db.revenue.totalEarned += profit.profit;
  db.revenue.pendingPayout += profit.profit;

  res.json({
    success: true,
    transaction,
    user: {
      credits: user.credits,
      purchased: user.purchased
    },
    message: '✅ Credits added successfully (Free Demo Mode - no payment required)'
  });
});

// 5. Use Credits (Call OpenRouter API)
app.post('/api/chat/completions', async (req, res) => {
  const { userId, model, messages } = req.body;

  const user = db.users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Estimate cost (OpenRouter charges per token)
  // This is a simplified calculation
  const estimatedCost = 1; // 1 credit per request (simplified)
  
  if (user.credits < estimatedCost) {
    return res.status(402).json({ 
      error: 'Insufficient credits',
      required: estimatedCost,
      available: user.credits,
      rechargeUrl: `${process.env.SITE_URL || 'http://localhost:3001'}/recharge`
    });
  }

  try {
    // Deduct credits
    user.credits -= estimatedCost;
    db.users.set(userId, user);

    // Forward to OpenRouter
    const openrouterResponse = await callOpenRouterAPI('/chat/completions', 'POST', {
      model: model || 'openai/gpt-3.5-turbo',
      messages
    });

    res.json({
      success: true,
      data: openrouterResponse,
      creditsRemaining: user.credits
    });
  } catch (error) {
    // Refund on failure
    user.credits += estimatedCost;
    res.status(500).json({ error: error.message });
  }
});

// 6. Revenue Dashboard (Admin only)
app.get('/admin/revenue', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== CONFIG.server.secretKey) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.json({
    totalEarned: db.revenue.totalEarned,
    pendingPayout: db.revenue.pendingPayout,
    lastPayout: db.revenue.lastPayout,
    transactions: db.transactions.slice(-10), // last 10
    activeUsers: db.users.size,
    uptime: process.uptime()
  });
});

// 7. Payout Trigger (Manual)
app.post('/admin/payout', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== CONFIG.server.secretKey) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (db.revenue.pendingPayout < CONFIG.profit.payoutThreshold) {
    return res.status(400).json({ 
      error: `Pending payout ($${db.revenue.pendingPayout}) below threshold $${CONFIG.profit.payoutThreshold}` 
    });
  }

  // In production: call Orange Money/Fawry API here
  const payoutAmount = db.revenue.pendingPayout;
  
  // Simulate payout (future: integrate real payment provider)
  db.revenue.lastPayout = {
    amount: payoutAmount,
    timestamp: new Date().toISOString(),
    method: 'orange_money',
    status: 'completed'
  };
  db.revenue.pendingPayout = 0;

  res.json({
    success: true,
    message: `✅ Payout of $${payoutAmount} initiated`,
    payout: db.revenue.lastPayout
  });
});

// 8. Webhook endpoint (Future Stripe integration)
app.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    // const event = stripe.webhooks.constructEvent(req.body, sig, CONFIG.server.webhookSecret);
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n🚀 OpenRouter Reseller System Started`);
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${CONFIG.openrouter.apiKey ? 'YES' : 'NO (set OPENROUTER_API_KEY)'}`);
  console.log(`💰 Profit margin: ${CONFIG.profit.marginPercent}%`);
  console.log(`💸 Payout threshold: $${CONFIG.profit.payoutThreshold}`);
  console.log(`🆓 Demo mode: credits granted without payment`);
  console.log(`\n📖 API Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/pricing - See prices`);
  console.log(`   POST /api/purchase - Buy credits (free demo)`);
  console.log(`   POST /api/chat/completions - Use credits`);
  console.log(`   GET  /admin/revenue - Admin dashboard`);
  console.log(`   POST /admin/payout - Trigger payout`);
});
