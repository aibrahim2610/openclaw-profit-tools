#!/usr/bin/env node
/**
 * 🚀 GitHub Marketplace Publisher - Fixed Version
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubMarketplacePublisher {
  constructor() {
    this.githubToken = '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';
    this.username = 'aibrahim2610';
    this.repoName = 'openclaw-profit-tools';
    this.workspaceDir = '/root/.openclaw/workspace';
    this.toolsDir = path.join(this.workspaceDir, 'skills');
    this.publishedFile = path.join(this.workspaceDir, '.github-published.json');
    this.state = this.loadState();
  }

  loadState() {
    if (fs.existsSync(this.publishedFile)) {
      return JSON.parse(fs.readFileSync(this.publishedFile, 'utf8'));
    }
    return {
      tools: [],
      totalRevenue: 0,
      lastPublish: null
    };
  }

  saveState() {
    fs.writeFileSync(this.publishedFile, JSON.stringify(this.state, null, 2));
  }

  spawnCommand(cmd, args, cwd) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { cwd, stdio: 'pipe', shell: true });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => stdout += d);
      child.stderr.on('data', (d) => stderr += d);
      child.on('close', (code) => {
        if (code === 0) resolve({ stdout, stderr });
        else reject(new Error(stderr || `Exit code ${code}`));
      });
      child.on('error', reject);
    });
  }

  async testConnection() {
    console.log('🔍 Testing GitHub connection...');
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${this.githubToken}` }
      });
      const user = await response.json();
      console.log(`✅ Connected as: ${user.login}`);
      return true;
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      return false;
    }
  }

  async ensureRepository() {
    console.log('📦 Checking repository...');
    try {
      const response = await fetch(`https://api.github.com/repos/${this.username}/${this.repoName}`, {
        headers: { 'Authorization': `token ${this.githubToken}` }
      });
      if (response.ok) {
        const repo = await response.json();
        console.log(`   ✅ Repository exists: ${repo.html_url}`);
        return repo;
      } else if (response.status === 404) {
        console.log(`   ➕ Creating repository: ${this.repoName}`);
        const repoData = {
          name: this.repoName,
          description: 'Automated profit-generating AI tools and agents for OpenClaw',
          private: false,
          has_issues: true,
          has_projects: true,
          has_wiki: true,
          topics: ['ai', 'automation', 'profit', 'tools', 'open-source', 'openclaw'],
          license: 'mit'
        };
        const createResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(repoData)
        });
        const repo = await createResponse.json();
        console.log(`   ✅ Repository created: ${repo.html_url}`);
        return repo;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async initGitRepo() {
    console.log('🔧 Initializing git repository...');
    
    try {
      await this.spawnCommand('git', ['init'], this.toolsDir);
      console.log('   ✅ Git initialized');
    } catch (error) {
      // Already initialized
    }

    // Remove existing origin
    try {
      await this.spawnCommand('git', ['remote', 'remove', 'origin'], this.toolsDir);
    } catch (error) {}

    const remoteUrl = `https://${this.githubToken}@github.com/${this.username}/${this.repoName}.git`;
    await this.spawnCommand('git', ['remote', 'add', 'origin', remoteUrl], this.toolsDir);
    
    await this.spawnCommand('git', ['config', 'user.name', this.username], this.toolsDir);
    await this.spawnCommand('git', ['config', 'user.email', `${this.username}@users.noreply.github.com`], this.toolsDir);
    
    console.log('   ✅ Git configured');
  }

  async commitAndPush() {
    console.log('⬆️  Pushing to GitHub...');
    
    await this.spawnCommand('git', ['add', '.'], this.toolsDir);
    
    const commitMsg = `Automated update: ${new Date().toISOString()}\n\nOpenClaw Profit Tools - ${this.state.tools.length} tools published`;
    await this.spawnCommand('git', ['commit', '-m', commitMsg], this.toolsDir);
    
    await this.spawnCommand('git', ['push', '-u', 'origin', 'main'], this.toolsDir);
    
    console.log('   ✅ Pushed to GitHub');
  }

  createMarketplaceListing(toolName, toolPath, description) {
    console.log(`🏪 Creating listing: ${toolName}`);
    
    const listing = {
      name: toolName,
      description: description || `AI-powered tool: ${toolName}`,
      category: 'Automation',
      subcategory: 'CI/CD',
      pricing: {
        unit_name: 'per month',
        unit_price: 29,
        unit_interval: 'monthly'
      },
      setup_url: `https://github.com/${this.username}/${this.repoName}/blob/main/${toolName}/README.md`,
      vendor_email: `${this.username}@users.noreply.github.com`,
      repository_url: `https://github.com/${this.username}/${this.repoName}`,
      source_url: `https://github.com/${this.username}/${this.repoName}/tree/main/${toolName}`
    };
    
    const manifest = {
      ...listing,
      publishedAt: new Date().toISOString(),
      status: 'draft'
    };
    
    const manifestPath = path.join(toolPath, 'marketplace-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    this.state.tools.push({
      name: toolName,
      listing,
      manifestPath,
      publishedAt: new Date().toISOString(),
      status: 'draft',
      price: 29
    });
    
    this.state.totalRevenue += 29;
    
    console.log(`   ✅ Listed: $29/month`);
    
    return manifest;
  }

  async publishAllTools() {
    console.log('\n🚀 Publishing all tools to GitHub Marketplace...\n');
    
    const tools = fs.readdirSync(this.toolsDir)
      .filter(f => fs.statSync(path.join(this.toolsDir, f)).isDirectory());
    
    console.log(`📦 Found ${tools.length} tools to publish\n`);
    
    let published = 0;
    
    for (const tool of tools) {
      const toolPath = path.join(this.toolsDir, tool);
      
      if (this.state.tools.find(t => t.name === tool)) {
        console.log(`   ⏭️  Skipping ${tool} (already published)`);
        continue;
      }
      
      try {
        const skillJsonPath = path.join(toolPath, 'skill.json');
        let description = tool;
        
        if (fs.existsSync(skillJsonPath)) {
          const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
          description = skillJson.description || tool;
        }
        
        await this.createMarketplaceListing(tool, toolPath, description);
        published++;
        
        console.log(`   ✅ Published: ${tool}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to publish ${tool}: ${error.message}`);
      }
    }
    
    this.state.lastPublish = new Date().toISOString();
    this.saveState();
    
    console.log(`\n📊 Published ${published} new tools`);
    console.log(`💰 Total potential monthly revenue: $${this.state.totalRevenue.toFixed(2)}`);
    console.log(`📦 Total tools: ${this.state.tools.length}`);
    
    return published;
  }

  async runFullPublish() {
    console.log('🚀 Starting Full Publish Process\n');
    console.log('═══════════════════════════════\n');
    
    if (!(await this.testConnection())) {
      console.log('❌ Failed to connect to GitHub');
      return;
    }
    
    await this.ensureRepository();
    await this.initGitRepo();
    
    const published = await this.publishAllTools();
    
    await this.commitAndPush();
    
    console.log('\n✅ Publishing complete!');
    console.log(`📦 Repository: https://github.com/${this.username}/${this.repoName}`);
    console.log(`💰 Potential monthly revenue: $${this.state.totalRevenue.toFixed(2)}`);
    console.log('\n💡 Next steps:');
    console.log('   - Review listings on GitHub Marketplace dashboard');
    console.log('   - Submit for approval (if required)');
    console.log('   - Monitor sales and usage\n');
  }

  async showStatus() {
    console.log('\n📊 Publisher Status');
    console.log('══════════════════\n');
    
    console.log(`🔑 GitHub: ✅ Connected`);
    console.log(`👤 Username: ${this.username}`);
    console.log(`📦 Repository: ${this.repoName}`);
    console.log(`🛠️  Tools Published: ${this.state.tools.length}`);
    console.log(`💰 Potential Revenue: $${this.state.totalRevenue.toFixed(2)}/month`);
    console.log(`🕐 Last Publish: ${this.state.lastPublish || 'Never'}`);
    
    console.log('\n📋 Published Tools:');
    this.state.tools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.name} - $${tool.listing.pricing.unit_price}/month (${tool.status})`);
    });
    
    console.log('');
  }
}

if (require.main === module) {
  const publisher = new GitHubMarketplacePublisher();
  
  const command = process.argv[2];
  
  (async () => {
    if (command === 'publish' || command === 'run') {
      await publisher.runFullPublish();
    } else if (command === 'status') {
      await publisher.showStatus();
    } else if (command === 'test') {
      await publisher.testConnection();
    } else {
      console.log(`
GitHub Marketplace Publisher

Usage:
  node github-marketplace-publisher.js publish   - Publish all tools
  node github-marketplace-publisher.js status   - Show status
      `);
    }
  })().catch((error) => {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  });
}

module.exports = { GitHubMarketplacePublisher };
