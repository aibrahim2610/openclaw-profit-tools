import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function generateChromeExtension(params: {
  name: string;
  description: string;
  permissions: string[];
  features: string[];
}): Promise<string> {
  const { name, description, permissions, features } = params;
  
  // Create safe extension ID
  const extensionId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const extensionPath = path.join(process.cwd(), `extensions/${extensionId}`);
  
  // Create directory structure
  await fs.promises.mkdir(extensionPath, { recursive: true });
  await fs.promises.mkdir(path.join(extensionPath, 'src'), { recursive: true });
  await fs.promises.mkdir(path.join(extensionPath, 'icons'), { recursive: true });
  
  // Create manifest.json
  const manifest = {
    manifest_version: 3,
    name,
    version: "1.0.0",
    description,
    permissions,
    host_permissions: permissions,
    background: {
      service_worker: "src/background.js"
    },
    action: {
      default_popup: "src/popup.html",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  };
  
  await fs.promises.writeFile(
    path.join(extensionPath, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  // Generate background script based on features
  const backgroundScript = generateBackgroundScript(features);
  await fs.promises.writeFile(
    path.join(extensionPath, 'src', 'background.js'),
    backgroundScript
  );
  
  // Generate popup
  const popupHTML = generatePopupHTML(name);
  await fs.promises.writeFile(
    path.join(extensionPath, 'src', 'popup.html'),
    popupHTML
  );
  
  // Generate popup CSS and JS
  await fs.promises.writeFile(
    path.join(extensionPath, 'src', 'popup.css'),
    generatePopupCSS()
  );
  
  await fs.promises.writeFile(
    path.join(extensionPath, 'src', 'popup.js'),
    generatePopupJS()
  );
  
  // Create placeholder icons
  await createPlaceholderIcons(path.join(extensionPath, 'icons'));
  
  // Create README
  await fs.promises.writeFile(
    path.join(extensionPath, 'README.md'),
    `# ${name}\n\n${description}\n\n## Features\n${features.map(f => `- ${f}`).join('\n')}\n`
  );
  
  // Package as ZIP
  const zipPath = await packageExtension(extensionPath);
  
  console.log(`Extension generated: ${extensionPath}`);
  console.log(`Package created: ${zipPath}`);
  
  return zipPath;
}

function generateBackgroundScript(features: string[]): string {
  let code = `// Background script for ${features.join(', ')}\nconsole.log('Extension background running.');\n\n`;
  
  if (features.includes('ad-blocker')) {
    code += `
// Ad blocker
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    const url = details.url.toLowerCase();
    if (url.includes('ad') || url.includes('tracker') || url.includes('popunder')) {
      return { cancel: true };
    }
  },
  { urls: ["*://*/*"] },
  ["blocking"]
);
`;
  }
  
  if (features.includes('price-tracker')) {
    code += `
// Price tracking
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackPrice') {
    // Store price data
    chrome.storage.local.get(['priceHistory'], (result) => {
      const history = result.priceHistory || [];
      history.push({
        url: request.url,
        price: request.price,
        timestamp: Date.now()
      });
      chrome.storage.local.set({ priceHistory: history });
      sendResponse({ success: true, history });
    });
    return true;
  }
});
`;
  }
  
  if (features.includes('seo-analyzer')) {
    code += `
// SEO Analyzer
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeSEO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      // Inject content script to analyze page
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/seo-analyzer.js']
      }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
`;
  }
  
  return code;
}

function generatePopupHTML(name: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${name}</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup">
    <h1>${name}</h1>
    <p>Extension is active</p>
    <button id="actionBtn">Perform Action</button>
  </div>
  <script src="popup.js"></script>
</body>
</html>`;
}

function generatePopupCSS(): string {
  return `body {
  width: 300px;
  padding: 15px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
}

.popup {
  text-align: center;
}

h1 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
}

p {
  color: #666;
  font-size: 12px;
  margin-bottom: 15px;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}

button:hover {
  background-color: #3367d6;
}

button:active {
  background-color: #2a56c6;
}`;
}

function generatePopupJS(): string {
  return `document.getElementById('actionBtn').addEventListener('click', () => {
  // Send message to background script
  chrome.runtime.sendMessage({ action: 'performAction' }, (response) => {
    if (response && response.success) {
      document.body.innerHTML = '<p>✓ Action completed successfully!</p>';
    }
  });
});`;
}

async function createPlaceholderIcons(iconsPath: string): Promise<void> {
  // Create simple colored squares as icons
  const colors = ['#4285f4', '#34a853', '#fbbc05', '#ea4335'];
  const sizes = [16, 48, 128];
  
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${colors[i % colors.length]}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size/3}" fill="white" text-anchor="middle" dy=".3em">E</text>
    </svg>`;
    
    // Convert SVG to PNG (simplified - in production would use proper conversion)
    const pngData = Buffer.from(svg);
    await fs.promises.writeFile(
      path.join(iconsPath, `icon${size}.png`),
      pngData
    );
  }
}

async function packageExtension(extensionPath: string): Promise<string> {
  const zipName = path.basename(extensionPath);
  const zipPath = path.join(path.dirname(extensionPath), `${zipName}.zip`);
  
  try {
    // Create ZIP using zip command
    await execAsync(`cd "${path.dirname(extensionPath)}" && zip -r "${zipName}.zip" "${path.basename(extensionPath)}"`);
    console.log(`Extension packaged: ${zipPath}`);
    return zipPath;
  } catch (error) {
    console.error('Failed to package extension:', error);
    throw error;
  }
}

export async function publishExtension(zipPath: string, apiKey: string): Promise<{ id: string; url: string }> {
  // This would integrate with Chrome Web Store API
  // For now, return mock success
  console.log(`Publishing extension: ${zipPath}`);
  
  // In production:
  // 1. Upload ZIP to Chrome Web Store via API
  // 2. Get extension ID
  // 3. Publish to store or private testing
  
  return {
    id: `extension_${Date.now()}`,
    url: `https://chrome.google.com/webstore/detail/mock-extension-id`
  };
}