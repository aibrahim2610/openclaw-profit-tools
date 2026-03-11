#!/usr/bin/env node

/**
 * Free Tools Library - Comprehensive Free Alternatives
 * مكتبة الأدوات المجانية الشاملة - بدائل لكل الأداة المدفوعة
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class FreeToolsLibrary {
  constructor() {
    this.libraryDir = '/root/.openclaw/workspace/free-tools-library';
    this.cacheDir = path.join(this.libraryDir, 'cache');
    this.toolsDir = path.join(this.libraryDir, 'tools');
    this.indexFile = path.join(this.libraryDir, 'index.json');
    
    this.tools = new Map();
    this.repositories = new Map();
    
    // Ensure directories
    this.ensureDirectories();
    
    // Load existing index
    this.loadIndex();
    
    console.log('📚 Free Tools Library initialized');
  }
  
  ensureDirectories() {
    [this.libraryDir, this.cacheDir, this.toolsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        const content = fs.readFileSync(this.indexFile, 'utf8');
        const index = JSON.parse(content);
        
        this.tools = new Map(Object.entries(index.tools || {}));
        this.repositories = new Map(Object.entries(index.repositories || {}));
        
        console.log(`📦 Loaded ${this.tools.size} tools from index`);
      }
    } catch (error) {
      console.error('Error loading index:', error);
    }
  }
  
  saveIndex() {
    try {
      const index = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        tools: Object.fromEntries(this.tools),
        repositories: Object.fromEntries(this.repositories)
      };
      
      fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2));
    } catch (error) {
      console.error('Error saving index:', error);
    }
  }
  
  /**
   * Clone a GitHub repository as a tool
   */
  async cloneTool(repoUrl, toolName) {
    try {
      console.log(`📥 Cloning ${repoUrl}...`);
      
      const toolDir = path.join(this.toolsDir, toolName);
      
      // Check if already exists
      if (fs.existsSync(toolDir)) {
        console.log(`   Tool already exists, updating...`);
        await execAsync(`cd "${toolDir}" && git pull origin main`, { timeout: 30000 });
      } else {
        await execAsync(`git clone "${repoUrl}" "${toolDir}"`, { timeout: 60000 });
      }
      
      // Analyze tool
      const metadata = await this.analyzeTool(toolDir, toolName, repoUrl);
      
      // Store in registry
      this.tools.set(toolName, {
        ...metadata,
        repoUrl,
        installedAt: new Date().toISOString(),
        status: 'active'
      });
      
      this.saveIndex();
      
      console.log(`✅ Tool installed: ${toolName}`);
      return metadata;
      
    } catch (error) {
      console.error(`Error cloning ${toolName}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Analyze tool directory
   */
  async analyzeTool(toolDir, toolName, repoUrl) {
    const pkgPath = path.join(toolDir, 'package.json');
    const readmePath = path.join(toolDir, 'README.md');
    
    const toolInfo = {
      name: toolName,
      repoUrl,
      version: '1.0.0',
      description: '',
      features: [],
      category: this.categorizeTool(toolName),
      size: this.getDirectorySize(toolDir),
      files: [],
      dependencies: []
    };
    
    // Read package.json if exists
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        toolInfo.version = pkg.version || '1.0.0';
        toolInfo.description = pkg.description || '';
        toolInfo.features = pkg.keywords || [];
        toolInfo.dependencies = Object.keys(pkg.dependencies || {});
      } catch (error) {
        console.log(`   Warning: Could not parse package.json for ${toolName}`);
      }
    }
    
    // Read README if exists
    if (fs.existsSync(readmePath)) {
      toolInfo.files.push('README.md');
    }
    
    // Check for important files
    const importantFiles = ['index.js', 'main.js', 'src/', 'lib/', 'dist/'];
    for (const file of importantFiles) {
      const filePath = path.join(toolDir, file);
      if (fs.existsSync(filePath)) {
        toolInfo.files.push(file);
      }
    }
    
    return toolInfo;
  }
  
  /**
   * Categorize tool based on name
   */
  categorizeTool(toolName) {
    const name = toolName.toLowerCase();
    
    if (name.includes('scrap') || name.includes('crawl') || name.includes('fetch')) {
      return 'scraping';
    }
    if (name.includes('memory') || name.includes('brain') || name.includes('store')) {
      return 'memory';
    }
    if (name.includes('profit') || name.includes('revenue') || name.includes('money')) {
      return 'profit';
    }
    if (name.includes('security') || name.includes('auth') || name.includes('encrypt')) {
      return 'security';
    }
    if (name.includes('chrome') || name.includes('extension') || name.includes('plugin')) {
      return 'browser';
    }
    if (name.includes('api') || name.includes('request') || name.includes('http')) {
      return 'api';
    }
    if (name.includes('data') || name.includes('database') || name.includes('sql')) {
      return 'database';
    }
    
    return 'utility';
  }
  
  /**
   * Get directory size
   */
  getDirectorySize(dir) {
    let size = 0;
    
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
          size += this.getDirectorySize(fullPath);
        } else {
          size += fs.statSync(fullPath).size;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return size;
  }
  
  /**
   * Install tool from GitHub
   */
  async installFromGitHub(repoUrl) {
    try {
      // Extract tool name from repo URL
      const match = repoUrl.match(/github\.com\/[^\/]+\/([^\/]+)(?:\.git)?$/);
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }
      
      const toolName = match[1];
      
      // Clone the tool
      const metadata = await this.cloneTool(repoUrl, toolName);
      
      console.log(`🎯 Tool installed successfully: ${toolName}`);
      console.log(`   Category: ${metadata.category}`);
      console.log(`   Version: ${metadata.version}`);
      console.log(`   Size: ${(metadata.size / 1024).toFixed(2)} KB`);
      console.log(`   Features: ${metadata.features.length} identified`);
      
      return metadata;
    } catch (error) {
      console.error('Installation failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Bulk install tools from list
   */
  async bulkInstall(repoList) {
    const results = [];
    const errors = [];
    
    for (const repoUrl of repoList) {
      try {
        console.log(`\n📦 Installing: ${repoUrl}`);
        const result = await this.installFromGitHub(repoUrl);
        results.push(result);
      } catch (error) {
        errors.push({ repo: repoUrl, error: error.message });
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    return {
      installed: results.length,
      failed: errors.length,
      tools: results,
      errors
    };
  }
  
  /**
   * Get tool information
   */
  getTool(toolName) {
    return this.tools.get(toolName);
  }
  
  /**
   * List all tools
   */
  listTools(category = null) {
    const tools = Array.from(this.tools.values());
    
    if (category) {
      return tools.filter(tool => tool.category === category);
    }
    
    return tools;
  }
  
  /**
   * Search tools by keyword
   */
  searchTools(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const [name, tool] of this.tools) {
      const searchText = `${name} ${tool.description} ${tool.features.join(' ')}`.toLowerCase();
      
      if (searchText.includes(queryLower)) {
        results.push(tool);
      }
    }
    
    return results;
  }
  
  /**
   * Get tools by category
   */
  getToolsByCategory(category) {
    return this.listTools().filter(tool => tool.category === category);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const categories = new Map();
    const totalSize = this.tools.reduce((sum, tool) => sum + tool.size, 0);
    
    for (const tool of this.tools.values()) {
      const count = categories.get(tool.category) || 0;
      categories.set(tool.category, count + 1);
    }
    
    return {
      totalTools: this.tools.size,
      totalSize,
      categories: Object.fromEntries(categories),
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Update all tools
   */
  async updateAll() {
    console.log('🔄 Updating all tools...');
    
    const updates = [];
    
    for (const [toolName, tool] of this.tools) {
      try {
        console.log(`   Updating ${toolName}...`);
        const toolDir = path.join(this.toolsDir, toolName);
        
        if (fs.existsSync(toolDir)) {
          await execAsync(`cd "${toolDir}" && git pull origin main`, { timeout: 30000 });
          
          // Re-analyze
          const metadata = await this.analyzeTool(toolDir, toolName, tool.repoUrl);
          this.tools.set(toolName, { ...tool, ...metadata });
          
          updates.push({ tool: toolName, status: 'updated' });
        }
      } catch (error) {
        updates.push({ tool: toolName, status: 'failed', error: error.message });
      }
    }
    
    this.saveIndex();
    
    return {
      checked: this.tools.size,
      updates
    };
  }
  
  /**
   * Create a free alternative tool
   */
  createFreeAlternative(paidToolName, functionality, implementation) {
    const toolName = `free-${paidToolName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const toolDir = path.join(this.freeToolsDir, toolName);
    
    if (!fs.existsSync(toolDir)) {
      fs.mkdirSync(toolDir, { recursive: true });
    }
    
    // Create index.js
    const indexContent = `/**
 * Free Alternative to ${paidToolName}
 * Generated by Free Tools Library
 *
 * Functionality: ${functionality}
 * License: MIT
 */

class ${this.pascalCase(toolName)} {
  constructor() {
    this.name = '${toolName}';
    this.version = '1.0.0';
    this.paidTool = '${paidToolName}';
  }
  
  ${implementation}
}

module.exports = { ${this.pascalCase(toolName)} };
`;
    
    fs.writeFileSync(path.join(toolDir, 'index.js'), indexContent);
    
    // Create package.json
    const pkgContent = {
      name: toolName,
      version: '1.0.0',
      description: `Free alternative to ${paidToolName}`,
      main: 'index.js',
      license: 'MIT',
      author: 'Free Tools Library',
      keywords: ['free', 'alternative', 'open-source']
    };
    
    fs.writeFileSync(
      path.join(toolDir, 'package.json'),
      JSON.stringify(pkgContent, null, 2)
    );
    
    // Add to index
    this.tools.set(toolName, {
      name: toolName,
      description: `Free alternative to ${paidToolName}`,
      category: 'free-alternative',
      version: '1.0.0',
      installedAt: new Date().toISOString(),
      status: 'active',
      size: this.getDirectorySize(toolDir),
      files: ['index.js', 'package.json']
    });
    
    this.saveIndex();
    
    console.log(`✅ Created free alternative: ${toolName}`);
    
    return toolName;
  }
  
  pascalCase(str) {
    return str.replace(/(\w)(\w*)/g, (_, first, rest) => first.toUpperCase() + rest.toLowerCase());
  }
  
  getStats() {
    const stats = this.getStats();
    return {
      ...stats,
      totalTools: this.tools.size,
      activeTools: Array.from(this.tools.values()).filter(t => t.status === 'active').length,
      categories: Object.fromEntries(
        Array.from(this.tools.values())
          .reduce((cats, tool) => {
            cats[tool.category] = (cats[tool.category] || 0) + 1;
            return cats;
          }, {})
      )
    };
  }
}

module.exports = { FreeToolsLibrary };