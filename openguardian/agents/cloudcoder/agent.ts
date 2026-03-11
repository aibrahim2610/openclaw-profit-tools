import { Agent } from "openclaw";
import { spawn } from "child_process";
import { promisify } from "util";

const exec = promisify(require("child_process").exec);

export class CloudCoderAgent extends Agent {
  async onMessage(message: any): Promise<void> {
    if (message.type === "code:generate") {
      const { task, requirements } = message.payload;
      
      try {
        // Generate code based on task
        const code = await this.generateCode(task, requirements);
        
        // Save to file
        const filename = this.generateFilename(task);
        await this.saveCode(code, filename);
        
        // Execute if requested
        if (message.payload.execute) {
          await this.executeCode(code, filename);
        }
        
        // Send result back
        this.gateway.sendMessage({
          type: "code:generated",
          payload: { filename, code, success: true }
        });
        
      } catch (error) {
        this.gateway.sendMessage({
          type: "code:error",
          payload: { error: error.message }
        });
      }
    }
  }

  private async generateCode(task: string, requirements: any): Promise<string> {
    // Simple code generation based on task
    let code = "";
    
    switch (task.toLowerCase()) {
      case "email-monitor":
        code = this.generateEmailMonitor();
        break;
      case "data-extractor":
        code = this.generateDataExtractor();
        break;
      case "api-wrapper":
        code = this.generateAPIWrapper(requirements.api);
        break;
      case "database-tool":
        code = this.generateDatabaseTool(requirements.db);
        break;
      case "chrome-extension":
        code = this.generateChromeExtension(requirements);
        break;
      default:
        code = await this.generateWithAI(task, requirements);
    }
    
    return code;
  }

  private generateEmailMonitor(): string {
    return `
const nodemailer = require('nodemailer');

class EmailMonitor {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async monitor(email: string) {
    console.log(\`Monitoring \${email} for breaches...\`);
    // TODO: Add monitoring logic
    return { success: true, email };
  }
}

module.exports = EmailMonitor;
    `;
  }

  private generateDataExtractor(): string {
    return `
class DataExtractor {
  async extractFromPDF(pdfPath: string) {
    console.log(\`Extracting data from \${pdfPath}...\`);
    // TODO: Add PDF extraction logic
    return { success: true, data: [] };
  }

  async extractFromWord(docPath: string) {
    console.log(\`Extracting data from \${docPath}...\`);
    // TODO: Add Word extraction logic
    return { success: true, data: [] };
  }
}

module.exports = DataExtractor;
    `;
  }

  private generateAPIWrapper(api: string): string {
    return `
class ${api.charAt(0).toUpperCase() + api.slice(1)}API {
  constructor() {
    this.baseURL = process.env.${api.toUpperCase()}_API_URL || "https://api.${api}.com";
    this.apiKey = process.env.${api.toUpperCase()}_API_KEY;
  }

  async fetchData(endpoint: string, params: any = {}) {
    const url = \`\${this.baseURL}/\${endpoint}\`;
    const headers = { Authorization: \`Bearer \${this.apiKey}\` };
    
    try {
      const response = await fetch(url, { headers, params });
      return await response.json();
    } catch (error) {
      console.error(\`API error: \${error.message}\`);
      return null;
    }
  }
}

module.exports = ${api.charAt(0).toUpperCase() + api.slice(1)}API;
    `;
  }

  private generateDatabaseTool(db: string): string {
    return `
class ${db.charAt(0).toUpperCase() + db.slice(1)}Database {
  constructor() {
    this.connection = new (require('sqlite3')).Database(process.env.DB_PATH || './data.db');
  }

  async query(sql: string, params: any[] = []) {
    return new Promise((resolve, reject) => => {
      this.connection.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async execute(sql: string, params: any[] = []) {
    return new Promise((resolve, reject) => > {
      this.connection.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
}

module.exports = ${db.charAt(0).toUpperCase() + db.slice(1)}Database;
    `;
  }

  private generateChromeExtension(requirements: any): string {
    const { name, description, permissions = [], features = [] } = requirements;
    
    return `
// Chrome Extension Auto-Generated
// Name: ${name}
// Description: ${description}

// Manifest v3
const manifest = {
  manifest_version: 3,
  name: "${name}",
  version: "1.0.0",
  description: "${description}",
  permissions: ${JSON.stringify(permissions)},
  host_permissions: ${JSON.stringify(permissions)},
  background: {
    service_worker: "background.js"
  },
  action: {
    default_popup: "popup.html",
    default_icon: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  content_scripts: [
    {
      matches: ["*://*/*"],
      js: ["content.js"]
    }
  ]
};

module.exports = manifest;
    `;
  }

  private async generateWithAI(task: string, requirements: any): Promise<string> {
    // Simple AI code generation using OpenClaw
    const prompt = \`Generate Node.js code for: \${task}\\nRequirements: \${JSON.stringify(requirements)}\`;
    
    try {
      // Use OpenClaw gateway to generate code
      const response = await fetch(\`http://localhost:18789/ai/generate\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.code || \`// TODO: Implement \${task}\`;
      }
    } catch (error) {
      console.error("AI generation error:", error.message);
    }
    
    return \`// Auto-generated code for: \${task}\n// TODO: Implement this functionality\n`;
  }

  private generateFilename(task: string): string {
    const timestamp = Date.now();
    const sanitized = task.toLowerCase().replace(/\\s+/g, '-').replace(/[^\\w\\-]/g, '');
    return \`./generated/\${sanitized}-\${timestamp}.js\`;
  }

  private async saveCode(code: string, filename: string): Promise<void> {
    const fs = require('fs');
    await fs.promises.mkdir(path.dirname(filename), { recursive: true });
    await fs.promises.writeFile(filename, code);
    console.log(\`Code saved to: \${filename}\`);
  }

  private async executeCode(code: string, filename: string): Promise<void> {
    try {
      const module = await import(filename);
      console.log(\`Executed \${filename} successfully\`);
    } catch (error) {
      console.error(\`Execution error in \${filename}: \${error.message}\`);
    }
  }
}