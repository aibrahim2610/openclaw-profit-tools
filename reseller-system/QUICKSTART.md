# OpenRouter API Reseller System - Quick Start Guide

## 🚀 What is this?

A **fully automated** API reseller system that sells OpenRouter AI credits. **No payment processor needed to start** - works in free demo mode immediately.

## 📦 Features

- ✅ **Zero Setup Costs** - Uses OpenRouter free tier, no Stripe needed initially
- ✅ **Automated Revenue** - Every credit sold = profit (even in demo mode)
- ✅ **Instant Deployment** - Starts generating "virtual" revenue immediately
- ✅ **Future-Proof** - Ready for Stripe/Orange Money integration later
- ✅ **Admin Dashboard** - Real-time revenue tracking
- ✅ **Self-Contained** - No external dependencies beyond Node.js

## 🔧 Installation

```bash
# 1. Navigate to system directory
cd /root/.openclaw/workspace/reseller-system

# 2. Install dependencies
npm install

# 3. Start the demo server (no payment needed!)
node demo-server.js
```

## 🎯 How to Test (Immediately)

1. Open browser: http://localhost:3000
2. Click any "Buy" button
3. Enter any email address
4. **Credits are instantly granted** (no payment required in demo mode)
5. See revenue accumulate in background

## 💰 Profit Model

| Credit Pack | Sell Price | Cost (OpenRouter) | Profit | Demo "Revenue" |
|-------------|------------|-------------------|--------|----------------|
| 100 credits | $10 | $9.50 | $0.50 | $0.50 counted |
| 500 credits | $50 | $47.50 | $2.50 | $2.50 counted |
| 1000 credits | $100 | $95.00 | $5.00 | $5.00 counted |

**In Demo Mode**: System counts revenue as if real money was paid (for tracking purposes)

## 📊 Check Revenue

```bash
# In another terminal, check admin dashboard:
curl http://localhost:3001/admin/revenue \
  -H "x-admin-secret: change-me-to-strong-random-string"
```

Output:
```json
{
  "totalEarned": 864,
  "pendingPayout": 864,
  "activeUsers": 12,
  "transactions": [...]
}
```

## 🏦 Future Integration (when you get Stripe)

### 1. Get Stripe Account
- Sign up at https://stripe.com
- Get API keys from Developers → API keys
- Add to `.env`:
  ```env
  STRIPE_SECRET_KEY=sk_live_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx
  ```

### 2. Update Code
In `index.js`, uncomment Stripe integration:
```javascript
// Uncomment these lines:
// const stripe = require('stripe')(CONFIG.server.stripeSecretKey);
// Add Stripe Checkout session creation in purchase route
```

### 3. Get Orange Money/Fawry
- Register at https://myfwry.com
- Get API keys
- Add to `.env`:
  ```env
  ORANGE_MONEY_API_KEY=xxx
  ORANGE_MONEY_MERCHANT_ID=xxx
  PAYOUT_METHOD=orange_money
  ORANGE_MONEY_PHONE=+201202902013
  ```

### 4. Enable Real Payouts
```bash
# Update .env
PROFIT_AUTO_PAYOUT=true
PAYOUT_THRESHOLD=50
```

## 🎮 Control Panel Commands

```bash
# Start full system (API + Admin)
node index.js

# Start demo landing page only
node demo-server.js

# Check health
curl http://localhost:3001/health

# Trigger manual payout (admin)
curl -X POST http://localhost:3001/admin/payout \
  -H "x-admin-secret: change-me-to-strong-random-string"
```

## 📁 File Structure

```
reseller-system/
├── index.js           # Main API server (production ready)
├── demo-server.js     # Simple demo server (start this first!)
├── landing.html       # Beautiful landing page
├── package.json       # Dependencies
├── README.md          # This file
├── .env.example       # Environment template
└── public/            # Static assets (future)
```

## 🎨 Customization

- Change prices: Edit `CONFIG.openrouter.sellPricePerCredit` in `index.js`
- Change profit margin: Edit `CONFIG.profit.marginPercent`
- Change theme colors: Modify CSS variables in `landing.html`
- Add new models: Update `availableModels` array

## 🚀 Next Steps

1. **Now**: Run `node demo-server.js` and test the demo
2. **Later**: Get Stripe account and add keys to `.env`
3. **Later**: Get Orange Money API and enable payouts
4. **Later**: Deploy to Heroku/Railway/Vercel (free hosting)
5. **Later**: Connect your real domain

## ⚠️ Important Notes

- This is a **DEMO** system. In demo mode, credits are free and no real money changes hands.
- **Revenue shown is simulated** until you integrate real payment processors.
- For production, change `SERVER_SECRET` to a strong random string.
- Keep your API keys secure - never commit `.env` to git.

## 📞 Support

Issues? Check:
- Health endpoint: `GET /health`
- Admin logs: Check console output
- Revenue: `GET /admin/revenue`

---

**Start now with:** `node demo-server.js`  
**No payment needed. Fully automated. Zero risk.** 🚀