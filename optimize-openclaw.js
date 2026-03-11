#!/usr/bin/env node

import { gateway } from 'openclaw';

async function optimizeOpenClawSettings() {
  console.log('🚀 Optimizing OpenClaw for better memory and session persistence...');
  
  try {
    // 1. Update compaction settings
    console.log('📁 Updating compaction settings...');
    await gateway.config.patch({
      agents: {
        defaults: {
          compaction: {
            mode: 'safeguard',
            maxHistoryShare: 0.85,
            reserveTokens: 3000,
            keepRecentTokens: 2000,
            recentTurnsPreserve: 5,
            reserveTokensFloor: 500,
            memoryFlush: {
              enabled: true,
              interval: '5m'
            }
          }
        }
      }
    });
    
    // 2. Increase session limits
    console.log('📄 Increasing session limits...');
    await gateway.config.patch({
      acp: {
        session: {
          idleTtlMs: 604800000, // 7 days
          maxSessions: 10000
        }
      }
    });
    
    // 3. Enable session persistence
    console.log('💾 Enabling session persistence...');
    await gateway.config.patch({
      agents: {
        defaults: {
          compaction: {
            postCompactionSections: [
              'Session Startup',
              'Safety',
              'Every Session',
              'Red Lines'
            ]
          }
        }
      }
    });
    
    console.log('✅ OpenClaw optimization completed successfully!');
    console.log('📊 New settings:');
    console.log('  - Compaction: Safeguard mode with 85% history retention');
    console.log('  - Session idle time: 7 days');
    console.log('  - Max sessions: 10,000');
    console.log('  - Memory flush: Every 5 minutes');
    console.log('  - Recent turns preserved: 5');
    
    // Restart gateway to apply changes
    console.log('🔄 Restarting OpenClaw to apply changes...');
    await gateway.restart();
    
    console.log('✅ OpenClaw restarted successfully!');
    
  } catch (error) {
    console.error('❌ Failed to optimize OpenClaw:', error);
    process.exit(1);
  }
}

optimizeOpenClawSettings().catch(console.error);