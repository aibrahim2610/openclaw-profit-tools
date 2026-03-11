#!/bin/bash

# نظام DataGuardian - التشغيل الآلي

echo "Starting DataGuardian System..."

# تهيئة البيئة
export NODE_ENV=production
export DATABASE_PATH="./data/guardian.db"
export STRIPE_SECRET_KEY="sk_test_..."
export EMAIL_HOST="smtp.gmail.com"
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"
export TELEGRAM_BOT_TOKEN="your-bot-token"
export TELEGRAM_BOT_CHAT_ID="your-chat-id"

# تهيئة قاعدة البيانات
node -e "require('./services/database').initializeDatabase().then(() => console.log('Database initialized'))"

# بدء تشغيل الوكلاء
node agents/monitor/agent.js &
node agents/notifier/agent.js &
node agents/upseller/agent.js &
node agents/remover/agent.js &
node agents/chrome-extension/agent.js &
node agents/cloudcoder/agent.js &

# بدء تشغيل الواجهة الأمامية
cd dashboard && node server.js &

# بدء تشغيل OpenClaw gateway
cd /root/.openclaw && node openclaw.mjs gateway &

echo "DataGuardian System Started Successfully!"
echo "Dashboard: http://localhost:3000"
echo "Gateway: http://localhost:18789"
echo "Agents: Running in background"

# الاحتفاظ بالعملية نشطة
wait