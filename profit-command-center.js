#!/usr/bin/env node

/**
 * 🎛️ Profit Command Center - وحدة التحكم الموحدة
 *目的: توفير واجهة واحدة للتحكم في النظام الربحي بالكامل
 * 
 * يدير:
 * - مصنع أدوات Claude Code
 * - وكلاء Agency-Agents
 * - محرك الربح الشامل
 * - المراقبة والإحصاءات
 * - التوسع والتطوير
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');

const { ClaudeCodeToolFactory } = require('./claude-code-tool-factory');
const { AgencySkillBridge } = require('./agency-bridge');
const { ProfitEngine } = require('./profit-engine');

class ProfitCommandCenter {
  constructor() {
    this.factory = null;
    this.bridge = null;
    this.engine = null;
    this.started = false;
    this.mode = 'profit-maximization';
    
    this.displayBanner();
  }

  displayBanner() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Claude Code Tool Factory & Profit Engine              ║
║   فلسفة: "التحرك بسرعة وكسر الأشياء"                        ║
║                                                              ║
║   IntegratedProfitSystem v1.0                              ║
║   Creator: OpenClaw Agent                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  async initialize() {
    console.log('\n🔧 تهيئة النظام...');
    
    this.factory = new ClaudeCodeToolFactory();
    this.bridge = new AgencySkillBridge();
    this.engine = new ProfitEngine();
    
    console.log('✅ المكونات جاهزة');
  }

  async start(engineConfig = {}) {
    if (this.started) {
      console.log('⚠️  النظام يعمل بالفعل');
      return;
    }
    
    console.log('\n🚀 بدء النظام الربحي الشامل...');
    
    // Apply engine config
    if (engineConfig.mode) this.engine.mode = engineConfig.mode;
    if (engineConfig.maxTools) this.engine.config.maxTools = engineConfig.maxTools;
    
    // Start profit engine
    await this.engine.start();
    this.started = true;
    
    console.log('\n✅ النظام الربحي يعمل الآن!');
    console.log('💰 استعد لتحقيق الأرباح...');
    
    this.showStatus();
  }

  async stop() {
    if (!this.started) {
      console.log('⚠️  النظام متوقف بالفعل');
      return;
    }
    
    this.engine.stop();
    this.started = false;
    
    console.log('✅ System stopped');
  }

  showStatus() {
    const stats = this.engine ? this.engine.stats : { totalRevenue: 0, transactions: 0 };
    const tools = this.factory ? this.factory.listTools() : [];
    const agents = this.bridge ? this.bridge.agents : {};
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 حالة النظام الربحي');
    console.log('═'.repeat(60));
    
    console.log('\n💰 الإحصائيات المالية:');
    console.log(`   إجمالي الإيرادات: $${stats.totalRevenue.toFixed(2)}`);
    console.log(`   عدد الدورات: ${stats.transactions}`);
    if (stats.lastCycle) {
      console.log(`   آخر دورة: $${stats.lastCycle.revenue.toFixed(2)} (${stats.lastCycle.duration}ms)`);
    }
    
    console.log('\n🔨 الأدوات:');
    console.log(`   متاح: ${tools.length}`);
    console.log(`   مولدة: ${this.factory ? this.factory.stats.toolsCreated : 0}`);
    
    console.log('\n🤖 الوكلاء:');
    console.log(`   مسجل: ${Object.keys(agents).length}`);
    console.log(`   نشط: ${this.engine ? this.engine.stats.agentsActivated : 0}`);
    
    if (this.started) {
      console.log('\n📈 الأداء:');
      const uptime = stats.uptime / (1000 * 60 * 60);
      console.log(`   تشغيل: ${uptime.toFixed(2)} ساعة`);
      console.log(`   الوضع: ${this.engine.mode}`);
    }
    
    console.log('\n' + '═'.repeat(60) + '\n');
  }

  async generateTool(specFile) {
    if (!fs.existsSync(specFile)) {
      console.log(`❌ الملف غير موجود: ${specFile}`);
      return;
    }
    
    try {
      const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
      const result = await this.factory.generateTool(spec);
      
      if (result.success) {
        console.log(`✅ تم توليد الأداة: ${spec.name}`);
        console.log(`   📁 ${result.skillPath}`);
      } else {
        console.log(`❌ فشل توليد الأداة: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ خطأ: ${error.message}`);
    }
  }

  async generateBatch(specsFile) {
    if (!fs.existsSync(specsFile)) {
      console.log(`❌ الملف غير موجود: ${specsFile}`);
      return;
    }
    
    try {
      const specs = JSON.parse(fs.readFileSync(specsFile, 'utf8'));
      if (!Array.isArray(specs)) {
        console.log('❌ الملف يجب أن يحتوي على مصفوفة JSON');
        return;
      }
      
      console.log(`🔨 توليد ${specs.length} أداة...`);
      const results = await this.factory.generateBatch(specs);
      
      const successful = results.filter(r => r.success).length;
      console.log(`✅ نجح: ${successful}/${specs.length}`);
    } catch (error) {
      console.log(`❌ خطأ: ${error.message}`);
    }
  }

  async registerAgents() {
    console.log('🌉 تسجيل وكلاء Agency...');
    await this.bridge.registerSkills();
    console.log('✅ الوكلاء مسجلين');
  }

  async quickProfit(cycles = 1) {
    console.log(`💰 تشغيل ${cycles} دورة ربح سريعة...`);
    
    for (let i = 0; i < cycles; i++) {
      console.log(`\n🔄 دورة ${i + 1}/${cycles}`);
      await this.engine.executeProfitCycle();
    }
    
    this.showStatus();
  }

  showFactoryStats() {
    const stats = this.factory.getStats();
    console.log('\n🔨 إحصائيات المصنع:');
    console.log(`   الأدوات: ${stats.totalTools} (نشط: ${stats.activeTools})`);
    console.log(`   الإيرادات المحتملة: $${stats.revenueGenerated}/month`);
    console.log(`   متوسط وقت البناء: ${stats.avgBuildTime.toFixed(1)}ms`);
  }

  showToolsList() {
    const tools = this.factory.listTools();
    console.log(`\n📋 الأدوات المتاحة (${tools.length}):`);
    
    tools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.name}`);
      console.log(`      📊 ${tool.type} | 💰 $${tool.revenueGenerated} | 🔄 ${tool.usageCount}`);
    });
  }

  async expand() {
    console.log('🔄 التوسع التلقائي...');
    await this.engine.expandSystem();
    this.showStatus();
  }

  async runDiagnostics() {
    console.log('\n🔍 تشخيص النظام...');
    
    const checks = [
      this.checkOpenClawConnection(),
      this.checkSkillsDirectory(),
      this.checkRegistry(),
      this.checkTools()
    ];
    
    const results = await Promise.allSettled(checks);
    let passed = 0;
    
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        console.log(`   ✅ Check ${i + 1}: OK`);
        passed++;
      } else {
        console.log(`   ❌ Check ${i + 1}: ${result.reason.message}`);
      }
    });
    
    console.log(`\n📊 Diagnostics: ${passed}/${checks.length} passed`);
  }

  async checkOpenClawConnection() {
    // Check if OpenClaw is running
    return new Promise((resolve, reject) => {
      exec('openclaw status', (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  async checkSkillsDirectory() {
    const skillsDir = '/root/.openclaw/workspace/skills';
    if (!fs.existsSync(skillsDir)) {
      throw new Error('Skills directory not found');
    }
    const skills = fs.readdirSync(skillsDir);
    return `Found ${skills.length} skills`;
  }

  async checkRegistry() {
    const registryPath = this.factory.registryPath;
    if (!fs.existsSync(registryPath)) {
      throw new Error('Registry not found');
    }
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return `Registry has ${Object.keys(registry.tools).length} tools`;
  }

  async checkTools() {
    const tools = this.factory.listTools();
    if (tools.length === 0) {
      throw new Error('No tools generated yet');
    }
    return `${tools.length} tools available`;
  }

  // Interactive REPL
  async repl() {
    console.log('\n🎛️  Commission Center REPL');
    console.log('Commands: start, stop, status, tools, agents, factory, generate, batch, expand, diagnostics, exit');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const ask = (query) => new Promise(resolve => rl.question(query, resolve));
    
    while (true) {
      const cmd = await ask('\n> ');
      
      try {
        switch (cmd.trim()) {
          case 'start':
            await this.start();
            break;
          case 'stop':
            await this.stop();
            break;
          case 'status':
            this.showStatus();
            break;
          case 'tools':
            this.showToolsList();
            break;
          case 'factory':
            this.showFactoryStats();
            break;
          case 'agents':
            await this.registerAgents();
            break;
          case 'generate':
            const specFile = await ask('Spec file: ');
            await this.generateTool(specFile);
            break;
          case 'batch':
            const batchFile = await ask('Batch specs file: ');
            await this.generateBatch(batchFile);
            break;
          case 'expand':
            await this.expand();
            break;
          case 'diagnostics':
            await this.runDiagnostics();
            break;
          case 'profit':
            const cycles = parseInt(await ask('Cycles (default 1): ') || '1');
            await this.quickProfit(cycles);
            break;
          case 'exit':
          case 'quit':
            rl.close();
            process.exit(0);
            break;
          default:
            console.log('Unknown command. Try: start, stop, status, tools, agents, factory, generate, batch, expand, profit, diagnostics, exit');
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }
}

// CLI Entry point
if (require.main === module) {
  const center = new ProfitCommandCenter();
  
  // Parse command line args
  const args = process.argv.slice(2);
  
  (async () => {
    await center.initialize();
    
    if (args.length === 0) {
      // Interactive REPL
      center.repl();
    } else {
      // Direct command
      const command = args[0];
      
      switch (command) {
        case 'start':
          const config = {};
          if (args.includes('--aggressive')) config.mode = 'aggressive';
          if (args.includes('--max')) config.maxTools = parseInt(args[args.indexOf('--max') + 1]);
          await center.start(config);
          break;
          
        case 'stop':
          await center.stop();
          break;
          
        case 'status':
          center.showStatus();
          break;
          
        case 'tools':
          center.showToolsList();
          break;
          
        case 'factory':
          center.showFactoryStats();
          break;
          
        case 'agents':
          await center.registerAgents();
          break;
          
        case 'generate':
          if (args.length < 2) {
            console.log('Usage: profit-center generate <spec.json>');
            process.exit(1);
          }
          await center.generateTool(args[1]);
          break;
          
        case 'batch':
          if (args.length < 2) {
            console.log('Usage: profit-center batch <specs.json>');
            process.exit(1);
          }
          await center.generateBatch(args[1]);
          break;
          
        case 'expand':
          await center.expand();
          break;
          
        case 'diagnostics':
          await center.runDiagnostics();
          break;
          
        case 'profit':
          const cycles = parseInt(args[1]) || 1;
          await center.quickProfit(cycles);
          break;
          
        default:
          console.log(`Unknown command: ${command}`);
          console.log('Commands: start, stop, status, tools, factory, agents, generate, batch, expand, diagnostics, profit');
          process.exit(1);
      }
    }
  })();
}

module.exports = { ProfitCommandCenter };