const express = require("express");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { getUserByEmail, createUser, storeBreach } = require("./services/database");
const { hibpCheck, getBreaches } = require("./services/dehashed");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// Check email endpoint
app.post("/api/check", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }
    
    // Check breaches
    const breaches = await getBreaches(email);
    
    // Store and notify
    await storeBreach(email, breaches);
    
    // Send notification if email exists in DB and opted-in
    const user = await getUserByEmail(email);
    if (user && user.opted_in) {
      // Trigger notifier agent
      // await sendNotification(user.notification_prefs, ...);
    }
    
    res.json({
      email,
      breachesFound: breaches.length > 0,
      breachCount: breaches.length,
      breaches: breaches.slice(0, 5) // Send top 5
    });
  } catch (error) {
    console.error("Check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Subscription endpoints
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email, plan } = req.body;
    
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { plan }
    });
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: getPriceId(plan) }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook for Stripe events
app.post("/api/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
  }
  
  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`DataGuardian Dashboard running on port ${PORT}`);
});