#!/usr/bin/env node

/**
 * Chrome Extension Factory (CEF)
 * يصنع إضافات Chrome آلياً حسب الحاجة
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ChromeExtensionFactory {
  constructor(outputDir = '/root/.openclaw/workspace/extensions') {
    this.outputDir = outputDir;
    this.templatesDir = path.join(__dirname, 'templates');
    this.extensions = new Map();
    
    // Ensure directories
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
    
    console.log('🔧 Chrome Extension Factory initialized');
  }
  
  /**
   * Create a new extension
   */
  async createExtension(manifest) {
    try {
      const extensionId = uuidv4();
      const extensionName = manifest.name || `extension-${extensionId.slice(0, 8)}`;
      const extensionDir = path.join(this.outputDir, extensionName);
      
      // Create extension directory
      if (!fs.existsSync(extensionDir)) {
        fs.mkdirSync(extensionDir, { recursive: true });
      }
      
      // Generate manifest.json
      const fullManifest = {
        manifest_version: 3,
        name: extensionName,
        version: manifest.version || '1.0.0',
        description: manifest.description || 'Auto-generated extension',
        permissions: manifest.permissions || ['storage', 'activeTab'],
        action: {
          default_popup: 'popup.html',
          default_icon: {
            '16': 'icons/icon16.png',
            '48': 'icons/icon48.png',
            '128': 'icons/icon128.png'
          }
        },
        background: {
          service_worker: 'background.js'
        },
        content_scripts: manifest.content_scripts || []
      };
      
      fs.writeFileSync(
        path.join(extensionDir, 'manifest.json'),
        JSON.stringify(fullManifest, null, 2)
      );
      
      // Generate popup.html
      const popupHtml = this.generatePopupHTML(manifest);
      fs.writeFileSync(
        path.join(extensionDir, 'popup.html'),
        popupHtml
      );
      
      // Generate popup.js
      const popupJs = this.generatePopupJS(manifest);
      fs.writeFileSync(
        path.join(extensionDir, 'popup.js'),
        popupJs
      );
      
      // Generate background.js
      const backgroundJs = this.generateBackgroundJS(manifest);
      fs.writeFileSync(
        path.join(extensionDir, 'background.js'),
        backgroundJs
      );
      
      // Generate icons (simple text-based for demo)
      this.generateIcons(extensionDir, extensionName);
      
      // Store extension metadata
      const extensionInfo = {
        id: extensionId,
        name: extensionName,
        directory: extensionDir,
        manifest: fullManifest,
        createdAt: new Date().toISOString()
      };
      
      this.extensions.set(extensionId, extensionInfo);
      
      console.log(`✅ Extension created: ${extensionName}`);
      console.log(`   Location: ${extensionDir}`);
      
      return extensionInfo;
      
    } catch (error) {
      console.error('Error creating extension:', error);
      throw error;
    }
  }
  
  /**
   * Generate popup HTML
   */
  generatePopupHTML(manifest) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 300px; padding: 15px; font-family: Arial, sans-serif; }
    h3 { margin: 0 0 10px 0; color: #4CAF50; }
    button { background: #4CAF50; color: white; border: none; padding: 8px 16px; cursor: pointer; margin: 5px; }
    button:hover { background: #45a049; }
    .status { margin: 10px 0; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h3>${manifest.name || 'Extension'}</h3>
  <p>${manifest.description || ''}</p>
  <div id="status" class="status">Ready</div>
  <button id="actionBtn">Execute</button>
  <script src="popup.js"></script>
</body>
</html>`;
  }
  
  /**
   * Generate popup JavaScript
   */
  generatePopupJS(manifest) {
    return `// Popup script
document.getElementById('actionBtn').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Running...';
  
  try {
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: '${manifest.action_type || 'execute'}',
      data: { timestamp: Date.now() }
    });
    
    status.textContent = 'Done: ' + JSON.stringify(response);
  } catch (error) {
    status.textContent = 'Error: ' + error.message;
  }
});`;
  }
  
  /**
   * Generate background script
   */
  generateBackgroundJS(manifest) {
    const backgroundScript = `// Background service worker
console.log('${manifest.name || 'Extension'} background loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === '${manifest.action_type || 'execute'}') {
    // Execute the extension's main logic
    executeMainLogic(request.data)
      .then(result = > sendResponse({ success: true, result }))
      .catch(error = > sendResponse({ success: false, error: error.message }));
    
    return true; // Keep channel open for async response
  }
});

async function executeMainLogic(data) {
  // Main extension logic here
  console.log('Executing with data:', data);
  
  // Example: Scraping, API calls, DOM manipulation, etc.
  const result = {
    timestamp: new Date().toISOString(),
    processed: true,
    data: data
  };
  
  return result;
}

// Optional: Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});`;
    
    return backgroundScript;
  }
  
  /**
   * Generate simple icons (placeholder)
   */
  generateIcons(extensionDir, name) {
    const iconsDir = path.join(extensionDir, 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }
    
    // Create simple colored icons using base64 PNG data
    const createIcon = (size) => {
      // Simple green square as placeholder
      return Buffer.from(
        `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
        'base64'
      );
    };
    
    const sizes = [16, 48, 128];
    sizes.forEach(size = > {
      const iconPath = path.join(iconsDir, `icon${size}.png`);
      fs.writeFileSync(iconPath, createIcon(size));
    });
  }
  
  /**
   * Package extension as .zip
   */
  async packageExtension(extensionId, outputPath) {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error('Extension not found');
    }
    
    // Use system zip if available
    const zipCmd = `cd ${this.outputDir} && zip -r ${outputPath} ${path.basename(extension.directory)}`;
    
    return new Promise((resolve, reject) = > {
      const { exec } = require('child_process');
      exec(zipCmd, (error, stdout, stderr) = > {
        if (error) {
          reject(error);
        } else {
          resolve(outputPath);
        }
      });
    });
  }
  
  /**
   * List all extensions
   */
  listExtensions() {
    return Array.from(this.extensions.values());
  }
  
  /**
   * Get extension by ID
   */
  getExtension(extensionId) {
    return this.extensions.get(extensionId);
  }
  
  /**
   * Delete extension
   */
  async deleteExtension(extensionId) {
    const extension = this.extensions.get(extensionId);
    if (!extension) {
      throw new Error('Extension not found');
    }
    
    // Remove directory
    const { exec } = require('child_process');
    exec(`rm -rf ${extension.directory}`, (error) = > {
      if (error) {
        throw error;
      }
    });
    
    this.extensions.delete(extensionId);
    console.log(`🗑️  Extension deleted: ${extension.name}`);
  }
}

// Export singleton
const extensionFactory = new ChromeExtensionFactory();

module.exports = { ChromeExtensionFactory, extensionFactory };