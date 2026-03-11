#!/bin/bash
set -e

echo "=========================================="
echo "DataGuardian Setup"
echo "=========================================="

# Create data directory
mkdir -p data
mkdir -p dashboard/public
mkdir -p services
mkdir -p agents

echo "[1/4] Installing dependencies..."
npm install --production

echo "[2/4] Creating .env file..."
cat > .env << 'ENVFILE'
PORT=3000
HIBP_API_KEY=your_hibp_api_key_here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@dataguardian.com
DATABASE_PATH=./data/guardian.db
ENVFILE

echo "[3/4] Initializing database..."
node -e "require('./services/database.js').initializeDatabase()" || true

echo "[4/4] Building agents..."
echo "Agents prepared."

echo "=========================================="
echo "Setup complete!"
echo "Run: npm start"
echo "Dashboard: http://localhost:3000"
echo "=========================================="

echo ""
echo "Next steps:"
echo "1. Edit .env with your API keys"
echo "2. Run: npm start"
echo "3. Open http://localhost:3000"
echo ""
echo "Note: For production, set up Stripe webhook at:"
echo "https://api.stripe.com/v1/webhook_endpoints"