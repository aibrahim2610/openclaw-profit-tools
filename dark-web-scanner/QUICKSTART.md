# Dark Web Scanner - Quick Start Guide

## 🕵️ What is this?

A fully automated dark web scanner that detects data breaches, collects information about leaks and their owners, then contacts them to offer remediation services for a fee.

## 🎯 How it works

1. **Scans dark web** (onion sites, forums, monitoring APIs)
2. **Detects data leaks** (credit cards, emails, passwords, etc.)
3. **Extracts owner information** from the leaked data
4. **Sends automated notifications** offering remediation services
5. **Generates revenue** from each successful remediation

## 🚀 Quick Start

### 1. Installation
```bash
cd /root/.openclaw/workspace/dark-web-scanner
npm install
```

### 2. Configuration
Create `.env` file:
```env
# Required
NODE_ENV=production
PORT=3004

# Security
ADMIN_SECRET=your-admin-secret-key

# Email for notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Future: Payment integration
# STRIPE_SECRET_KEY=sk_live_your_stripe_key
# ORANGE_MONEY_API_KEY=your_orange_money_key
```

### 3. Start Scanner
```bash
npm start
```

Server will start on http://localhost:3004

## 📊 API Endpoints

### Public
- `GET /health` - System health and stats
- `POST /scan/start` - Start manual scan

### Admin (requires `x-admin-secret` header)
- `GET /stats` - Leak statistics
- `GET /notifications` - Pending notifications
- `POST /admin/payout` - Trigger payout

## 📈 Revenue Model

| Service | Price |
|---------|-------|
| Base remediation | $199 |
| Per record found | $5 |
| Early response discount | 10% |

**Example**: 10 credit cards found = $199 + (10 × $5) = $249

## 🔧 Configuration

### Scanning Settings
- **Interval**: Every 6 hours (configurable)
- **Sources**: Onion sites, forums, public APIs
- **Timeout**: 30 seconds per request
- **Max concurrent**: 5 requests

### Data Types Monitored
- Credit cards (Visa, Mastercard, Amex)
- Email addresses
- Passwords
- Social Security Numbers
- Phone numbers
- Physical addresses
- Usernames
- IP addresses

## 🛡️ Security Features

- **Rate limiting**: Prevents abuse
- **User agent rotation**: Mimics real browsers
- **Timeout protection**: Prevents hanging requests
- **Error handling**: Robust error recovery
- **Logging**: Detailed audit trails

## 📋 File Structure

```
dark-web-scanner/
├── index.js           # Main scanner system
├── package.json       # Dependencies
├── .env.example       # Environment template
├── QUICKSTART.md      # This file
├── logs/              # Scan logs
├── data/              # Saved state
├── notifications/     # Pending notifications
└── tools/             # Generated tools (future)
```

## ⚠️ Important Notes

- **Legal compliance**: Ensure you comply with local laws regarding dark web scanning
- **Ethical use**: Only use for legitimate security purposes
- **Data protection**: Handle all data responsibly and securely
- **Rate limiting**: Be respectful of target sites

## 📞 Support

Issues? Check:
- Health endpoint: `GET /health`
- Scan logs: `/logs/dark-web-scanner.log`
- Revenue: `GET /admin/revenue`

## 🚀 Next Steps

1. **Test**: Run `npm start` and visit http://localhost:3004/health
2. **Configure**: Set up your `.env` with email credentials
3. **Deploy**: Deploy to production server
4. **Monitor**: Check stats at `GET /stats`
5. **Integrate payments**: Add Stripe/Orange Money for payouts

---

**Start scanning now:** `npm start`  
**No payment needed to start monitoring.** 🕵️‍♂️