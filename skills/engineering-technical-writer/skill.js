#!/usr/bin/env node

/**
 * Agency Agent Skill: Engineering Technical Writer
 * revenue: true
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class engineering-technical-writerSkill {
  constructor() {
    this.name = 'engineering-technical-writer';
    this.agentPath = '/root/.openclaw/workspace/agency-agents/engineering/engineering-technical-writer.md';
  }

  async execute(task, context = {}) {
    try {
      console.log('🤖 Executing Engineering Technical Writer agent...');
      const agentDef = this.loadAgentDefinition();
      const prompt = this.buildPrompt(agentDef, task, context);
      const response = await this.runAgent(prompt, agentDef);
      const result = this.parseDeliverables(response, agentDef);
      console.log('✅ Engineering Technical Writer completed');
      return result;
    } catch (error) {
      console.error('❌ engineering-technical-writer error:', error.message);
      throw error;
    }
  }

  loadAgentDefinition() {
    const content = fs.readFileSync(this.agentPath, 'utf8');
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*(.+)$/m);
    return {
      name: nameMatch ? nameMatch[1] : this.name,
      description: descMatch ? descMatch[1] : '',
      definition: content
    };
  }

  buildPrompt(agentDef, task, context) {
    return `You are ${agentDef.name}, an AI specialist agent.\n\n` +
           `AGENT DEFINITION:\n${agentDef.definition}\n\n` +
           `CURRENT TASK:\n${task}\n\n` +
           `CONTEXT:\n${JSON.stringify(context, null, 2)}` +
           `\n\nINSTRUCTIONS:\n` +
           `1. Follow your agent's workflows and processes\n` +
           `2. Produce deliverables according to your specifications\n` +
           `3. Include code examples when relevant\n` +
           `4. Provide measurable outcomes\n` +
           `5. Use your unique communication style\n\n` +
           `Please execute the task and return the results.`;
  }

  async runAgent(prompt, agentDef) {
    // Mock implementation for now
    return `Task completed by ${agentDef.name}\n\nDeliverable: Implementation complete.`;
  }

  parseDeliverables(response, agentDef) {
    const outputDir = path.join('/tmp', 'agency-output', this.name, Date.now().toString());
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'response.md'), response);
    const codeBlocks = response.match(/```\w+\n[\s\S]*?```/g) || [];
    const files = [];
    codeBlocks.forEach((block, idx) => {
      const match = block.match(/```(\w+)\n([\s\S]*?)```/);
      if (match) {
        const lang = match[1];
        const code = match[2];
        const ext = this.getExtensionForLanguage(lang);
        const filename = 'file' + (idx + 1) + ext;
        fs.writeFileSync(path.join(outputDir, filename), code);
        files.push({ filename, language: lang, path: path.join(outputDir, filename) });
      }
    });
    return {
      agent: agentDef.name,
      outputDir,
      files,
      rawResponse: response,
      timestamp: new Date().toISOString()
    };
  }

  getExtensionForLanguage(lang) {
    const extensions = {
      'javascript': '.js',
      'js': '.js',
      'typescript': '.ts',
      'ts': '.ts',
      'python': '.py',
      'java': '.java',
      'go': '.go',
      'rust': '.rs',
      'csharp': '.cs',
      'c': '.c',
      'cpp': '.cpp',
      'html': '.html',
      'css': '.css',
      'json': '.json',
      'yaml': '.yaml',
      'yml': '.yml',
      'markdown': '.md',
      'md': '.md',
      'bash': '.sh',
      'shell': '.sh',
      'sql': '.sql'
    };
    return extensions[lang.toLowerCase()] || '.txt';
  }
}

module.exports = { engineering-technical-writerSkill };