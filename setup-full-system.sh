#!/bin/bash

# OpenClaw Full System Setup Script
# يقوم بإعداد نظام OpenClaw الكامل مع جميع الأدوات

echo "🚀 إعداد نظام OpenClaw الكامل..."

# 1. تحديث النظام
echo "📦 1. تحديث النظام"
sudo apt update && sudo apt upgrade -y

# 2. تثبيت Node.js
echo "📦 2. تثبيت Node.js"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. تثبيت OpenClaw
echo "📦 3. تثبيت OpenClaw"
npm install -g openclaw

# 4. تهيئة OpenClaw
echo "📦 4. تهيئة OpenClaw"
openclaw configure --section web

# 5. تثبيت ClawHub
echo "📦 5. تثبيت ClawHub"
npm install -g clawhub

# 6. تثبيت الأدوات الأساسية
echo "📦 6. تثبيت الأدوات الأساسية"
clawhub install --force byterover
sleep 5
clawhub install --force scrapling
sleep 5

# 7. تثبيت الأدوات من GitHub
echo "📦 7. تثبيت الأدوات من GitHub"
cd /root/.openclaw/workspace
git clone https://github.com/openclaw/nix-steipete-tools.git
cd nix-steipete-tools
npm install
cd ..

# 8. تثبيت أدوات الربح
echo "📦 8. تثبيت أدوات الربح"
cd /root/.openclaw/workspace
git clone https://github.com/openclaw/profit-system.git
cd profit-system
npm install
cd ..

# 9. تثبيت مصنع الأدوات
echo "📦 9. تثبيت مصنع الأدوات"
cd /root/.openclaw/workspace
git clone https://github.com/tools-factory/free-tools.git
cd free-tools
git checkout main
npm install
cd ..

# 10. تثبيت ByteRover
echo "📦 10. تثبيت ByteRover"
cd /root/.openclaw/workspace
git clone https://github.com/openclaw/byterover.git
cd byterover
npm install
cd ..

# 11. تثبيت Fourm-Prowler
echo "📦 11. تثبيت Fourm-Prowler"
cd /root/.openclaw/workspace
git clone https://github.com/openclaw/fourm-prowler.git
cd fourm-prowler
npm install
cd ..

# 12. تثبيت Chrome Extension Factory
echo "📦 12. تثبيت Chrome Extension Factory"
cd /root/.openclaw/workspace
git clone https://github.com/openclaw/chrome-extension-factory.git
cd chrome-extension-factory
npm install
cd ..

# 13. تهيئة النظام
echo "📦 13. تهيئة النظام"
cp /root/.openclaw/workspace/openclaw.json /root/.openclaw/openclaw.json
sudo systemctl restart openclaw

# 14. التحقق من النظام
echo "📦 14. التحقق من النظام"
sleep 5
openclaw status

# 15. تشغيل ByteRover
echo "📦 15. تشغيل ByteRover"
nohup node /root/.openclaw/workspace/byterover/index.js > /root/.openclaw/logs/byterover.log 2>&1 &
echo "ByteRover PID: $!"

# 16. تشغيل Fourm-Prowler
echo "📦 16. تشغيل Fourm-Prowler"
nohup node /root/.openclaw/workspace/fourm-prowler/index.js > /root/.openclaw/logs/fourm-prowler.log 2>&1 &
echo "Fourm-Prowler PID: $!"

# 17. تشغيل مصنع الأدوات
echo "📦 17. تشغيل مصنع الأدوات"
nohup node /root/.openclaw/workspace/tools-factory/index.js > /root/.openclaw/logs/tools-factory.log 2>&1 &
echo "Tools Factory PID: $!"

echo "✅ تم إعداد النظام بنجاح!"
echo ""
echo "📋 النظام الآن يعمل:"
echo "- ByteRover: يحفظ الذاكرة طويلة المدى"
echo "- Fourm-Prowler: يرصد الفرص الربحية"
echo "- Tools Factory: يصنع الأدوات المجانية"
echo "- Chrome Extension Factory: يصنع الإضافات"
echo "- Profit System: نظام الربح الآلي"
echo ""
echo "🔧 للتحكم في النظام:"
echo "openclaw status - حالة النظام"
echo "openclaw cron list - قائمة المهام المجدولة"
echo "brv query <topic> - البحث في الذاكرة"
echo "brv curate <summary> - حفظ المعرفة"
echo ""