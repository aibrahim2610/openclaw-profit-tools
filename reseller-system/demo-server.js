#!/usr/bin/env node

/**
 * Demo Landing Page Server
 * Serves the reseller landing page and API
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname)));

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'landing.html'));
});

// API endpoints (mock for demo)
app.get('/api/pricing', (req, res) => {
  res.json({
    creditPrice: 0.10,
    minPurchase: 1,
    maxPurchase: 1000,
    currency: 'USD',
    availableModels: ['gpt-4', 'claude-3', 'gemini-pro']
  });
});

app.post('/api/purchase', (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount < 1 || amount > 1000) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Simulate credit generation
  const credits = amount;
  
  res.json({
    success: true,
    credits: credits,
    message: 'Credits granted (demo mode)'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Demo server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} to see the landing page`);
});