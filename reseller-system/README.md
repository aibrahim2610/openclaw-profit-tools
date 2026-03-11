# OpenRouter API Reseller

A fully automated API reseller system that sells OpenRouter credits with profit margin. Free tier available for demo.

## Features

- **Automated Credit Selling**: Users buy credits and use them for AI API calls
- **Profit Margin**: Built-in profit calculation (default 5%)
- **Free Demo Mode**: Credits granted without payment for testing
- **Admin Dashboard**: Real-time revenue tracking
- **Future Stripe Integration**: Ready for payment processing
- **Auto Payout**: Automatic payout to Orange Money/Instapay when threshold reached

## Quick Start

### 1. Clone & Install
```bash
cd reseller-system
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
# Required
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
PORT=3001
SITE_URL=http://localhost:3001

# Optional (for admin access)
SERVER_SECRET=your-secret-key

# Future (Stripe integration)
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 3. Start Server
```bash
npm start
```

Server will start on http://localhost:3001

## API Endpoints

### Public
- `GET /health` - Health check
- `GET /api/pricing` - See pricing
- `POST /api/purchase` - Buy credits (free demo)
- `POST /api/chat/completions` - Use credits

### Admin (requires `x-admin-secret` header)
- `GET /admin/revenue` - Revenue dashboard
- `POST /admin/payout` - Trigger payout

## How It Works

1. **User visits `/`** and sees pricing
2. **User clicks Buy** → credits granted (free demo mode)
3. **User uses credits** via `/api/chat/completions`
4. **System tracks profit** automatically
5. **When revenue >= $50** → auto payout to Orange Money

## Profit Calculation

- **Cost per credit**: $0.095 (OpenRouter bulk price)
- **Sell price per credit**: $0.10 (default)
- **Profit per credit**: $0.005
- **Margin**: 5%

## Future Integration

### Stripe Integration
```javascript
// In /api/purchase route
const stripe = require('stripe')(CONFIG.server.stripeSecretKey);
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: { name: 'OpenRouter Credits' },
      unit_amount: amount * 100
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${CONFIG.server.siteUrl}/success`,
  cancel_url: `${CONFIG.server.siteUrl}/cancel`
});
```

### Orange Money Payout
```javascript
// In /admin/payout route
const payoutResponse = await fetch('https://api.orange-money.com/payouts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${ORANGE_MONEY_API_KEY}` },
  body: JSON.stringify({
    amount_cents: payoutAmount * 100,
    currency: 'EGP',
    recipient_phone: '+201202902013'
  })
});
```

## Deployment

### GitHub Pages (Frontend only)
1. Build frontend (if any)
2. Push to `gh-pages` branch

### Heroku/Glitch (Full stack)
1. Push to Heroku
2. Set environment variables

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Security

- Rate limiting on API endpoints
- Helmet security headers
- Environment variables for secrets
- Admin authentication required

## License

MIT License - feel free to modify and use for your projects.

---

**Note**: This is a demo system. For production use, integrate real payment providers and implement proper user authentication.