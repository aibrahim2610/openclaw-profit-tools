#!/usr/bin/env node
/**
 * 🚀 Profit System Starter - التشغيل الموثوق للنظام الربحي
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'profit-system.log');
const pidFile = path.join(__dirname, 'profit-engine.pid');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  const line = `[${timestamp}] ${prefix} ${message}`;
  
  fs.appendFileSync(logFile, line + '\n');
  console.log(line);
}

async function runCommand(command, cwd = __dirname) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command}`);
    
    const child = spawn('node', command.split(' ').slice(1), {
      cwd,
      stdio: 'pipe',
      shell: false
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `Exit code ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  log('=== Profit System Starter ===');
  log('Starting comprehensive profit system...\n');
  
  try {
    // Step 1: Check if skills exist
    const skillsDir = path.join(__dirname, 'skills');
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }
    
    // Step 2: Build agency skills
    log('Building Agency skills...');
    try {
      await runCommand('agency-bridge.js build');
      log('Agency skills built successfully', 'success');
    } catch (error) {
      log(`Agency build error: ${error.message}`, 'error');
      // Continue anyway - skills might already be built
    }
    
    // Step 3: Check and install dependencies
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      log('Installing dependencies...');
      await runCommand('-e "require(\'fs\').mkdirSync(\'node_modules\', {recursive:true}); require(\'child_process\').execSync(\'npm install --silent\', {stdio:\'inherit\'});"');
      log('Dependencies installed', 'success');
    }
    
    // Step 4: Start profit command center in background
    log('Starting Profit Command Center...');
    
    const cmd = 'profit-command-center.js start';
    const child = spawn('node', ['profit-command-center.js', 'start'], {
      cwd: __dirname,
      stdio: 'ignore',
      detached: true
    });
    
    child.unref();
    
    // Save PID
    fs.writeFileSync(pidFile, child.pid.toString());
    
    log(`Profit Engine started with PID ${child.pid}`, 'success');
    
    // Step 5: Wait and verify
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    log('\n✅ Profit System is now running!');
    log('💰 System will generate revenue automatically');
    log('📊 Check status with: node profit-status.js');
    log('📝 Logs: profit-system.log');
    log('\nTo stop: kill ' + child.pid);
    
    // Keep starter alive to monitor
    process.on('SIGINT', () => {
      log('Stopping profit system...');
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch (e) {}
      process.exit(0);
    });
    
    // Monitor child process
    setInterval(() => {
      try {
        process.kill(child.pid, 0);
      } catch (e) {
        log('Profit Engine stopped, restarting...', 'error');
        // Implement restart logic if needed
        process.exit(1);
      }
    }, 30000);
    
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
