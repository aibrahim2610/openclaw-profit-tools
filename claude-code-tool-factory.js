#!/usr/bin/env node

/**
 * Claude Code Tool Factory - Fixed Version
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ClaudeCodeToolFactory {
  constructor() {
    this.factoryId = uuidv4();
    this.toolsDir = path.join('/root/.openclaw/workspace', 'tools-factory');
    this.skillsDir = path.join('/root/.openclaw/workspace', 'skills');
    this.templatesDir = path.join(this.toolsDir, 'templates');
    this.generatedDir = path.join(this.toolsDir, 'generated');
    this.registryPath = path.join(this.toolsDir, 'registry.json');
    
    this.registry = this.loadRegistry();
    this.stats = {
      toolsCreated: 0,
      revenueGenerated: 0,
      avgBuildTime: 0,
      successRate: 0
    };
  }

  loadRegistry() {
    if (fs.existsSync(this.registryPath)) {
      return JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
    }
    return { tools: {}, meta: { created: Date.now(), version: '1.0' } };
  }

  saveRegistry() {
    fs.mkdirSync(this.toolsDir, { recursive: true });
    fs.writeFileSync(this.registryPath, JSON.stringify(this.registry, null, 2));
  }

  validateSpec(spec) {
    if (!spec.name) throw new Error('اسم الأداة مطلوب');
    if (!spec.type) throw new Error('نوع الأداة مطلوب');
    if (!spec.description) throw new Error('وصف الأداة مطلوب');
    if (!spec.inputs || !Array.isArray(spec.inputs)) throw new Error('المدخلات مطلوبة (مصفوفة)');
    if (!spec.outputs) throw new Error('المخرجات مطلوبة');
    
    const existing = Object.values(this.registry.tools).find(t => t.name === spec.name);
    if (existing) throw new Error(`الأداة "${spec.name}" موجودة بالفعل`);
  }

  selectTemplate(type) {
    const templates = {
      'web-scraper': 'scraper-template.js',
      'data-processor': 'processor-template.js',
      'api-integration': 'api-template.js',
      'notification': 'notification-template.js',
      'billing': 'billing-template.js',
      'monitor': 'monitor-template.js',
      'automation': 'automation-template.js',
      'analytics': 'analytics-template.js',
      'default': 'base-template.js'
    };
    return templates[type] || templates.default;
  }

  getBaseTemplate(type) {
    const templates = {
      'web-scraper': `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { web_search, web_fetch } = require('openclaw');

class {TOOL_NAME} {
  constructor() {
    this.name = '{TOOL_NAME}';
    this.version = '1.0.0';
    this.revenuePerUse = 5;
  }

  async execute(task, context = {}) {
    const startTime = Date.now();
    console.log(\`🔧 Running {TOOL_NAME}: \${task}\`);
    
    try {
      const results = await this.scrape(task, context);
      this.trackRevenue(task, Date.now() - startTime);
      return { success: true, data: results, revenue: this.revenuePerUse, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error(\`❌ {TOOL_NAME} error: \${error.message}\`);
      return { success: false, error: error.message, revenue: 0 };
    }
  }

  async scrape(task, context) {
    return { message: 'Scraping implementation needed' };
  }

  trackRevenue(task, duration) {
    console.log(\`💰 Revenue: $\${this.revenuePerUse} (duration: \${duration}ms)\`);
  }
}

module.exports = { {TOOL_NAME} };`,
      'default': `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

class {TOOL_NAME} {
  constructor() {
    this.name = '{TOOL_NAME}';
    this.version = '1.0.0';
    this.revenuePerUse = 2;
  }

  async execute(task, context = {}) {
    console.log(\`⚙️ Executing {TOOL_NAME}: \${task}\`);
    
    try {
      const result = await this.process(task, context);
      return { success: true, result: result, revenue: this.revenuePerUse };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async process(task, context) {
    return { status: 'generated', task: task };
  }
}

module.exports = { {TOOL_NAME} };`
    };
    return templates[type] || templates.default;
  }

  createSkillStructure(skillPath, spec, code) {
    fs.mkdirSync(skillPath, { recursive: true });
    fs.writeFileSync(path.join(skillPath, 'skill.js'), code);
    
    const skillJson = {
      name: spec.name,
      description: spec.description,
      version: '1.0.0',
      author: 'Claude Code Tool Factory',
      category: spec.type,
      revenue: true,
      revenuePerUse: spec.revenueEstimate || 25,
      requires: ['openclaw', 'agentmem'],
      inputs: spec.inputs,
      outputs: spec.outputs,
      factoryGenerated: true,
      factoryId: this.factoryId,
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(path.join(skillPath, 'skill.json'), JSON.stringify(skillJson, null, 2));
    
    const readme = `# ${spec.name}
## Description
${spec.description}
## Usage
\`\`\`javascript
const { ${spec.name} } = require('${skillPath}');
const tool = new ${spec.name}();
const result = await tool.execute('your task', { context: 'data' });
\`\`\`
## Revenue
- Per use: $${spec.revenueEstimate || 25}
- Estimated monthly: $${(spec.revenueEstimate || 25) * 30}
## Generated
- Factory: Claude Code Tool Factory
- Generated: ${new Date().toISOString()}
- Template: ${spec.type}
`;
    fs.writeFileSync(path.join(skillPath, 'README.md'), readme);
  }

  registerTool(spec, skillPath) {
    const toolId = spec.name.toLowerCase().replace(/\s+/g, '-');
    this.registry.tools[toolId] = {
      id: toolId,
      name: spec.name,
      type: spec.type,
      path: skillPath,
      specification: spec,
      createdAt: new Date().toISOString(),
      status: 'active',
      revenueGenerated: 0,
      usageCount: 0
    };
    this.saveRegistry();
  }

  async generateTool(spec) {
    console.log(`🔨 توليد أداة: ${spec.name} (${spec.type})`);
    
    try {
      this.validateSpec(spec);
      const template = this.selectTemplate(spec.type);
      const baseCode = this.getBaseTemplate(spec.type);
      
      const toolCode = baseCode
        .replace(/{TOOL_NAME}/g, spec.name.replace(/\s+/g, ''))
        .replace(/{TOOL_DESCRIPTION}/g, spec.description)
        .replace(/{TOOL_TYPE}/g, spec.type)
        .replace(/{REVENUE_MODEL}/g, spec.revenueModel || 'per-use')
        .replace(/{INPUTS}/g, JSON.stringify(spec.inputs, null, 2))
        .replace(/{OUTPUTS}/g, spec.outputs)
        .replace(/{GENERATED_DATE}/g, new Date().toISOString())
        .replace(/{UUID}/g, uuidv4());
      
      const toolId = spec.name.toLowerCase().replace(/\s+/g, '-');
      const skillPath = path.join(this.skillsDir, toolId);
      this.createSkillStructure(skillPath, spec, toolCode);
      this.registerTool(spec, skillPath);
      
      console.log(`   ✅ ${spec.name} جاهزة (${skillPath})`);
      return { success: true, skillPath, toolId };
      
    } catch (error) {
      console.log(`   ❌ فشل: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async generateBatch(specs) {
    console.log(`🚀 توليد ${specs.length} أداة...`);
    const results = [];
    
    for (const spec of specs) {
      const result = await this.generateTool(spec);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ نجح ${successful}/${specs.length}`);
    
    return results;
  }

  getStats() {
    return {
      ...this.stats,
      totalTools: Object.keys(this.registry.tools).length,
      activeTools: Object.values(this.registry.tools).filter(t => t.status === 'active').length,
      uptime: process.uptime(),
      factoryId: this.factoryId
    };
  }

  listTools() {
    return Object.values(this.registry.tools).map(tool => ({
      name: tool.name,
      type: tool.type,
      status: tool.status,
      revenueGenerated: tool.revenueGenerated,
      usageCount: tool.usageCount,
      path: tool.path
    }));
  }

  createTemplates() {
    fs.mkdirSync(this.templatesDir, { recursive: true });
    
    const templates = {
      'web-scraper-template.js': 'Fast web scraping with revenue tracking',
      'data-processor-template.js': 'High-volume data processing',
      'api-integration-template.js': 'External API integrations',
      'notification-template.js': 'Push notification delivery',
      'billing-template.js': 'Payment and subscription management',
      'monitor-template.js': 'System health monitoring',
      'automation-template.js': 'Task automation engine',
      'analytics-template.js': 'Revenue and usage analytics'
    };
    
    for (const [filename, description] of Object.entries(templates)) {
      const filePath = path.join(this.templatesDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `// Template: ${description}\n// Generated by Claude Code Tool Factory\nmodule.exports = { Description: '${description}' };`);
      }
    }
    
    console.log(`📁 تم إنشاء ${Object.keys(templates).length} قالب`);
  }
}

if (require.main === module) {
  const factory = new ClaudeCodeToolFactory();
  factory.createTemplates();
  console.log('✅ Claude Code Tool Factory جاهز');
}

module.exports = { ClaudeCodeToolFactory };
