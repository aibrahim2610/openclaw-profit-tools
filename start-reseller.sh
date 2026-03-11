#!/bin/bash

# OpenRouter Reseller System - One-Click Launcher
# Starts everything needed for automated revenue generation

echo "🚀 Starting OpenRouter Reseller System..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Navigate to reseller system directory
cd /root/.openclaw/workspace/reseller-system

# Install dependencies if node_modules not exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo ""
fi

# Start demo server (landing page)
echo -e "${GREEN}🌐 Starting Demo Server (Landing Page) on port 3000...${NC}"
node demo-server.js &
DEMO_PID=$!
sleep 2

# Check if demo server started
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Demo server is running!${NC}"
    echo "   📍 Open http://localhost:3000 to see the landing page"
else
    echo -e "${RED}❌ Demo server failed to start${NC}"
fi

echo ""
echo -e "${GREEN}📊 Starting Admin Dashboard on port 3001...${NC}"
node index.js &
API_PID=$!
sleep 2

# Check if API server started
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ API server is running!${NC}"
    echo "   📍 Admin dashboard: http://localhost:3001/admin/revenue"
    echo "   🔑 Secret: change-me-to-strong-random-string"
else
    echo -e "${YELLOW}⚠️  API server may need configuration.${NC}"
    echo "   Check: OPENROUTER_API_KEY in .env"
fi

echo ""
echo "============================================"
echo -e "${GREEN}🎉 SYSTEM READY${NC}"
echo "============================================"
echo ""
echo "🎯 TEST NOW:"
echo "   1. Open http://localhost:3000"
echo "   2. Click any 'Buy' button"
echo "   3. Enter any email"
echo "   4. See revenue appear in admin dashboard"
echo ""
echo "📊 CHECK REVENUE:"
echo "   curl -H 'x-admin-secret: change-me-to-strong-random-string' http://localhost:3001/admin/revenue"
echo ""
echo "💰 NEXT STEPS TO GET REAL MONEY:"
echo "   1. Get Stripe account → add STRIPE_SECRET_KEY to .env"
echo "   2. Get Orange Money (myfwry.com) → add API keys to .env"
echo "   3. Uncomment Stripe code in index.js"
echo "   4. Deploy to internet (GitHub Pages + Heroku)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait forever (or until Ctrl+C)
wait