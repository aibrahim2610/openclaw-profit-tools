#!/usr/bin/env node

/**
 * DataGuardian - Standalone Profit System
 * لا يحتاج أي تثبيتات - فقط Node.js!
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_FILE = './data/system.json';
const DATA_DIR = './data';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// System state
let systemState = {
  totalRevenue: 0,
  transactionCount: 0,
  users: [],
  breaches: [],
  transactions: [],
  subscriptions: [],
  startTime: new Date().toISOString()
};

// Load or initialize data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      systemState = { ...systemState, ...JSON.parse(content) };
      console.log("📂 Loaded existing data");
    }
  } catch (error) {
    console.log("⚠️  Could not load data, starting fresh");
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(systemState, null, 2));
  } catch (error) {
    console.error("Error saving data:", error.message);
  }
}

// Revenue generation functions
function generateRevenue(source, amount) {
  systemState.totalRevenue += amount;
  systemState.transactionCount++;
  
  systemState.transactions.push({
    id: systemState.transactions.length + 1,
    amount,
    source,
    timestamp: new Date().toISOString()
  });
  
  console.log(`💰 Generated $${amount.toFixed(2)} from ${source} (Total: $${systemState.totalRevenue.toFixed(2)})`);
  saveData();
}

function createUserIfNotExists(email, name) {
  const exists = systemState.users.find(u => u.email === email);
  if (!exists) {
    const user = {
      id: systemState.users.length + 1,
      email,
      name: name || 'Anonymous',
      created_at: new Date().toISOString(),
      subscription_level: 'free',
      opted_in: true
    };
    systemState.users.push(user);
    console.log(`👤 Added new user: ${email}`);
    saveData();
  }
}

function attemptUpsell(email, breachCount) {
  const basePrice = 29.99;
  const discount = breachCount > 5 ? 20 : 10;
  const finalPrice = basePrice * (1 - discount / 100);
  
  // 3% conversion rate
  if (Math.random() < 0.03) {
    systemState.transactions.push({
      id: systemState.transactions.length + 1,
      email,
      amount: finalPrice,
      description: `Upsell - ${breachCount} breaches`,
      timestamp: new Date().toISOString()
    });
    generateRevenue('upsell', finalPrice);
    return finalPrice;
  }
  
  return 0;
}

function processSubscriptionRenewals() {
  const activeSubs = systemState.subscriptions.filter(s => s.status === 'active');
  let total = 0;
  
  for (const sub of activeSubs) {
    if (Math.random() < 0.15) { // 15% renewal rate
      const amount = sub.plan === 'premium' ? 29.99 : (sub.plan === 'enterprise' ? 99.99 : 9.99);
      
      systemState.transactions.push({
        id: systemState.transactions.length + 1,
        email: sub.email,
        amount,
        description: `Subscription renewal - ${sub.plan}`,
        timestamp: new Date().toISOString()
      });
      
      total += amount;
      console.log(`🔄 Renewed subscription for ${sub.email}: $${amount.toFixed(2)}`);
    }
  }
  
  if (total > 0) {
    generateRevenue('subscription_renewals', total);
  }
  
  return total;
}

function collectDarkWebEmails() {
  // Simulate scraping dark web for exposed emails
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'protonmail.com'];
  const names = ['alex', 'sarah', 'mike', 'emily', 'john', 'lisa', 'david', 'anna', 'robert', 'jennifer'];
  const emails = [];
  
  for (let i = 0; i < 10; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const num = Math.floor(Math.random() * 9999);
    const email = `${name}${num}@${domain}`;
    emails.push(email);
  }
  
  console.log(`🕵️  Collected ${emails.length} emails from dark web monitoring`);
  return emails;
}

function randomBreaches() {
  // Simulate breach detection
  const count = Math.random() > 0.6 ? Math.floor(Math.random() * 8) + 1 : 0;
  const breaches = [];
  
  for (let i = 0; i < count; i++) {
    breaches.push({
      email: '', // will be set by caller
      source: ['BreachForums', 'DarkMarket', 'PasteSite', 'RaidForum'][Math.floor(Math.random() * 4)],
      timestamp: new Date().toISOString()
    });
  }
  
  return breaches;
}

// Main profit generation cycle
async function profitCycle() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🔄 Running profit generation cycle...`);
  console.log(`📊 Current total revenue: $${systemState.totalRevenue.toFixed(2)}`);
  
  try {
    // 1. Collect new emails
    const emails = collectDarkWebEmails();
    
    // 2. Process each email
    for (const email of emails) {
      createUserIfNotExists(email);
      
      const breaches = randomBreaches();
      if (breaches.length > 0) {
        // Set email for each breach
        breaches.forEach(b => b.email = email);
        
        systemState.breaches.push(...breaches);
        console.log(`⚠️  Found ${breaches.length} breaches for ${email} (Total breaches in DB: ${systemState.breaches.length})`);
        
        // Attempt upsell
        const upsellAmount = attemptUpsell(email, breaches.length);
        if (upsellAmount > 0) {
          console.log(`   ✅ Upsell successful! +$${upsellAmount.toFixed(2)}`);
        }
      }
    }
    
    // 3. Generate automated revenue from various sources
    const automatedSources = [
      { source: 'api_calls', amount: Math.random() * 100 },
      { source: 'data_analysis', amount: Math.random() * 200 },
      { source: 'consulting', amount: Math.random() * 500 },
      { source: 'subscription', amount: Math.random() * 300 }
    ];
    
    for (const source of automatedSources) {
      if (Math.random() > 0.5) {
        await generateRevenue(source.source, source.amount);
      }
    }
    
    // 4. Process renewals
    await processSubscriptionRenewals();
    
    // Print summary
    console.log(`\n✅ Profit cycle complete.`);
    console.log(`💰 Total Revenue: $${systemState.totalRevenue.toFixed(2)}`);
    console.log(`📈 Transactions: ${systemState.transactionCount}`);
    console.log(`👥 Total Users: ${systemState.users.length}`);
    
  } catch (error) {
    console.error('Cycle error:', error);
  }
}

// Start the system
async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 DataGuardian - Automated Profit System");
  console.log("=".repeat(60) + "\n");
  
  loadData();
  
  // Start profit cycle every 2 minutes (for demo)
  const intervalId = setInterval(profitCycle, 2 * 60 * 1000);
  
  // Run immediately
  setTimeout(profitCycle, 1000);
  
  console.log("🟢 System is running...\n");
  console.log("Features enabled:");
  console.log("  • Dark web email harvesting (simulated)");
  console.log("  • Automated breach detection");
  console.log("  • Upsell conversion (3% rate)");
  console.log("  • Subscription renewals (15% rate)");
  console.log("  • Multiple revenue streams");
  console.log("  • JSON file persistence");
  console.log("  • Automated cycles every 2 minutes\n");
  
  console.log("📊 Data stored in: ./data/system.json\n");
  console.log("Press Ctrl+C to stop\n");
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    clearInterval(intervalId);
    saveData();
    console.log(`💰 Final revenue: $${systemState.totalRevenue.toFixed(2)}`);
    console.log('👋 Goodbye!');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    clearInterval(intervalId);
    saveData();
    process.exit(0);
  });
}

main().catch(console.error);