import { Agent } from "openclaw";
import fs from 'fs';
import path from 'path';

export class ChromeExtensionAgent extends Agent {
  async onMessage(message: any): Promise<void> {
    if (message.type === "extension:generate") {
      const { name, description, permissions, features } = message.payload;
      
      try {
        // Generate extension structure
        const extensionPath = await this.generateExtension(name, description, permissions, features);
        
        // Package the extension
        await this.packageExtension(extensionPath);
        
        // Publish to Chrome Web Store (automated)
        await this.publishExtension(extensionPath);
        
        // Send success message
        this.gateway.sendMessage({
          type: "extension:published",
          payload: { name, extensionPath, success: true }
        });
        
      } catch (error) {
        this.gateway.sendMessage({
          type: "extension:error",
          payload: { error: error.message }
        });
      }
    }
  }

  private async generateExtension(name: string, description: string, permissions: string[], features: string[]): Promise<string> {
    const extensionPath = `./extensions/${name}`;
    
    // Create directory structure
    await fs.promises.mkdir(extensionPath, { recursive: true });
    await fs.promises.mkdir(path.join(extensionPath, 'src'), { recursive: true });
    await fs.promises.mkdir(path.join(extensionPath, 'icons'), { recursive: true });
    
    // Create manifest.json
    const manifest = this.createManifest(name, description, permissions, features);
    await fs.promises.writeFile(path.join(extensionPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // Create background script
    const background = this.createBackgroundScript(features);
    await fs.promises.writeFile(path.join(extensionPath, 'src', 'background.js'), background);
    
    // Create popup.html
    const popup = this.createPopupHTML(name);
    await fs.promises.writeFile(path.join(extensionPath, 'src', 'popup.html'), popup);
    
    // Create popup.css
    const popupCSS = this.createPopupCSS();
    await fs.promises.writeFile(path.join(extensionPath, 'src', 'popup.css'), popupCSS);
    
    // Create icons (placeholder)
    await this.createPlaceholderIcons(extensionPath);
    
    console.log(`Extension generated: ${extensionPath}`);
    return extensionPath;
  }

  private createManifest(name: string, description: string, permissions: string[], features: string[]): any {
    return {
      "manifest_version": 3,
      "name": name,
      "version": "1.0.0",
      "description": description,
      "permissions": permissions,
      "host_permissions": permissions,
      "background": {
        "service_worker": "src/background.js"
      },
      "action": {
        "default_popup": "src/popup.html",
        "default_icon": {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      },
      "icons": {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      },
      "content_scripts": [
        {
          "matches": ["*://*/*"],
          "js": ["src/content.js"]
        }
      ]
    };
  }

  private createBackgroundScript(features: string[]): string {
    let featuresCode = "";
    
    if (features.includes("ad-blocker")) {
      featuresCode += `
// Ad Blocker
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.url.includes('ad') || details.url.includes('tracker')) {
      return { cancel: true };
    }
  },
  { urls: ["*://*/*"] },
  ["blocking"]
);
`;
    }

    if (features.includes("price-tracker")) {
      featuresCode += `
// Price Tracker
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "trackPrice") {
    // TODO: Track price logic
    sendResponse({ success: true });
  }
});
`;
    }

    return `
// Background script for Chrome Extension
console.log('Chrome Extension Background Script Running');

${featuresCode}
`;
  }

  private createPopupHTML(name: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${name}</title>
  <link rel="stylesheet" href="src/popup.css">
</head>
<body>
  <div class="popup">
    <h1>${name}</h1>
    <p>Extension is running...</p>
    <button id="btnAction">Action</button>
  </div>
  
  <script src="src/popup.js"></script>
</body>
</html>
`;
  }

  private createPopupCSS(): string {
    return `
.popup {
  width: 300px;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  margin: 0 0 10px 0;
  font-size: 18px;
}

p {
  margin: 0 0 20px 0;
  color: #666;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #3367d6;
}
`;
  }

  private async createPlaceholderIcons(extensionPath: string): Promise<void> {
    // Create placeholder icon files
    const iconSizes = [16, 48, 128];
    
    for (const size of iconSizes) {
      const iconContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
      await fs.promises.writeFile(path.join(extensionPath, `icons/icon${size}.png`), iconContent);
    }
  }

  private async packageExtension(extensionPath: string): Promise<void> {
    // Create ZIP package
    const { exec } = require('child_process');
    const zipCommand = `cd ${extensionPath} && zip -r ../${path.basename(extensionPath)}.zip .`;
    
    await new Promise((resolve, reject) = > {
      exec(zipCommand, (error, stdout, stderr) = > {
        if (error) {
          reject(error);
        } else {
          console.log("Extension packaged successfully");
          resolve();
        }
      });
    });
  }

  private async publishExtension(extensionPath: string): Promise<void> {
    // Mock publish to Chrome Web Store
    // In production, this would use the Chrome Web Store API
    console.log("Publishing extension to Chrome Web Store...");
    
    // Simulate publish process
    await new Promise(resolve = > setTimeout(resolve, 2000));
    
    console.log("Extension published successfully!");
  }
}