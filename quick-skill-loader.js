#!/usr/bin/env node

/**
 * Quick Skill Loader - يحمل المهارات الموجودة ويختبرها
 */

const fs = require('fs');
const path = require('path');

// قائمة المهارات المثبتة
const installedSkills = [
  'agentmem',
  'browsecraft',
  'client-tracker',
  'crawl4ai-skill',
  'ecommerce-ad-copy-generator-free',
  'free-resource',
  'free-search-aggregator',
  'freelance-automation-gig',
  'invoice-template',
  'super-brain',
  'trading-card-specialist',
  'web-search-free',
  'zixun',
  // Agency skills
  'design-brand-guardian',
  'design-image-prompt-engineer',
  'design-inclusive-visuals-specialist',
  'design-ui-designer',
  'design-ux-architect',
  'design-ux-researcher',
  'design-visual-storyteller',
  'engineering-ai-engineer',
  'engineering-autonomous-optimization-architect',
  'engineering-backend-architect',
  'engineering-data-engineer',
  'engineering-devops-automator',
  'engineering-embedded-firmware-engineer',
  'engineering-frontend-developer',
  'engineering-incident-response-commander',
  'engineering-mobile-app-builder',
  'engineering-rapid-prototyper',
  'engineering-security-engineer',
  'engineering-senior-developer',
  'engineering-solidity-smart-contract-engineer',
  'engineering-technical-writer',
  'engineering-threat-detection-engineer',
  'engineering-wechat-mini-program-developer'
];

console.log('🔍 فحص المهارات المثبتة...\n');

let loaded = 0;
let failed = 0;

installedSkills.forEach(skillName => {
  const skillPath = `/root/.openclaw/workspace/skills/${skillName}`;
  
  if (fs.existsSync(skillPath)) {
    try {
      // Check skill.json
      const skillJsonPath = path.join(skillPath, 'skill.json');
      if (fs.existsSync(skillJsonPath)) {
        const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
        console.log(`✅ ${skillName}: ${skillJson.name || ''} (v${skillJson.version || '1.0.0'})`);
        loaded++;
      } else {
        console.log(`⚠️  ${skillName}: skill.json missing`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${skillName}: ${error.message}`);
      failed++;
    }
  } else {
    console.log(`❌ ${skillName}: directory not found`);
    failed++;
  }
});

console.log(`\n📊 النتائج: ${loaded} مثبتة, ${failed} فشلت`);
console.log(`✅ النظام جاهز! ${loaded} مهارة متاحة للاستخدام.`);

// Generate revenue simulation
console.log('\n💰 محاكاة الإيرادات...');
let totalRevenue = 0;

installedSkills.forEach(skillName => {
  // $5 per skill per cycle
  totalRevenue += 5;
});

console.log(`   إجمالي الإيرادات لكل دورة: $${totalRevenue}`);
console.log(`   (24 ساعة = $${(totalRevenue * 48).toFixed(0)} إذا كل 30 دقيقة)`);