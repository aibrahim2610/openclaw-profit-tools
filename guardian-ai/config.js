// Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_...";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const DATABASE_PATH = process.env.DATABASE_PATH || "./data/guardian.db";
const SERVICE_NAME = "DataGuardian";
const VERSION = "1.0.0";

// Subscription plans
const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "1 email monitoring",
      "Basic breach alerts",
      "No removal service"
    ]
  },
  basic: {
    name: "Basic",
    price: 4.99,
    features: [
      "Monitor up to 5 emails",
      "Instant breach notifications",
      "Removal from 5 people-search sites"
    ]
  },
  premium: {
    name: "Premium",
    price: 14.99,
    features: [
      "Unlimited email monitoring",
      "Real-time alerts",
      "Removal from 50+ sites",
      "Priority support"
    ]
  },
  enterprise: {
    name: "Enterprise",
    price: 49.99,
    features: [
      "Unlimited everything",
      "Custom monitoring",
      "24/7 support",
      "White-glove removal service"
    ]
  }
};

// Stripe price IDs (would be set in production)
const PRICE_IDS = {
  basic: "price_basic_...",
  premium: "price_premium_...",
  enterprise: "price_enterprise_..."
};

// Notification templates
const TEMPLATES = {
  breachAlert: `🚨 إشعار أمني عاجل\n\nتم اكتشاف تسريب جديد يتضمن بريدك: {{email}}\n\nالتسريبات: {{breachCount}}\n{% each breaches %}\n- {{name}} ({{date}})\n{% endeach %}\n\nللحصول على التقرير الكامل وخطط الحماية: اضغط هنا [link]\n\n-data-guardian.com`,
  
  upsellPremium: `🔐 عرض خاص: حماية متقدمة\n\nاكتشفنا {{breachCount}} تسريبًا يتضمن بريدك. مع خطة Premium يمكنك:\n• مراقبة غير محدودة\n• إزالة من 50+ موقع تتبع\n• دعم على مدار الساعة\n\nاشترك الآن بخصم 20% لـ $11.99/شهر`,
  
  removalReport: `✅ تقرير إزالة البيانات\n\nتمت إزالة بياناتك من {{completed}} موقع.\n{{pending}} موقع ما زال قيد المعالجة.\n\nتابع التقدم من لوحة التحكم.`
};

module.exports = {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  DATABASE_PATH,
  SERVICE_NAME,
  VERSION,
  PLANS,
  PRICE_IDS,
  TEMPLATES
};