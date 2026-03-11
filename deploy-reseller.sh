#!/bin/bash

# OpenRouter Reseller - Quick Deploy Script
# One-command deployment for production

echo "🚀 Deploying OpenRouter Reseller System..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this from /root/.openclaw/workspace/reseller-system${NC}"
    exit 1
fi

# 1. Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# 2. Setup environment
echo -e "${YELLOW}📝 Setting up environment...${NC}"

# Create .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo "   Please edit .env with your API keys"
    echo "   nano .env"
    echo ""
fi

# 3. Setup OpenRouter API Key
echo -e "${YELLOW}🔑 Setting up OpenRouter API Key...${NC}"

# Check if API key exists
if grep -q "OPENROUTER_API_KEY=" .env; then
    echo -e "${GREEN}✅ OPENROUTER_API_KEY found in .env${NC}"
else
    echo -e "${RED}❌ OPENROUTER_API_KEY not found in .env${NC}"
    echo "   Please get your key from https://openrouter.ai/keys"
    echo "   and add it to .env"
    exit 1
fi

# 4. Start production server
echo -e "${GREEN}🚀 Starting production server...${NC}"

# Start in background
nohup node index.js > server.log 2>&1 &
PID=$!

echo -e "${GREEN}✅ Server started with PID: $PID${NC}"
echo "   📍 API: http://localhost:3001"
echo "   📊 Admin: http://localhost:3001/admin/revenue"
echo "   🔑 Secret: change-me-to-strong-random-string"
echo ""

# 5. Show health check
echo -e "${YELLOW}🔍 Checking health...${NC}"
sleep 3

if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ System is healthy!${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "   Check logs: tail -f server.log"
fi

echo ""
echo "============================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE${NC}"
echo "============================================"
echo ""
echo -e "${YELLOW}📊 System Status:${NC}"
echo "   API Server: http://localhost:3001"
echo "   Admin Dashboard: http://localhost:3001/admin/revenue"
echo "   Demo Landing: http://localhost:3000 (optional)"
echo ""
echo -e "${YELLOW}🔑 Admin Access:${NC}"
echo "   Secret Header: x-admin-secret: change-me-to-strong-random-string"
echo ""
echo -e "${YELLOW}💰 Next Steps:${NC}"
echo "   1. Get Stripe account for real payments"
echo "   2. Get Orange Money account for payouts"
echo "   3. Deploy to production (Heroku, Vercel, etc.)"
echo "   4. Connect your domain"
echo ""
echo -e "${GREEN}🚀 Your automated revenue system is ready!${NC}"
echo ""

# Keep script running to show logs
tail -f server.log