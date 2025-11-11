#!/usr/bin/env bun
/**
 * 🐝 Vibee Development Server
 * Professional dev environment with auto-reload, health checks, and admin panel
 */

import { spawn, spawnSync } from 'child_process';
import { watch } from 'fs';
import { resolve } from 'path';

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Vibee brand colors
  yellow: '\x1b[33m',
  brightYellow: '\x1b[93m',
  orange: '\x1b[38;5;214m',

  // Status colors
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

// 🐝 Vibee Logo (ANSI Art)
const logo = `
${colors.brightYellow}                    ___
                 .-'   \`-.
                /  ${colors.bright}o   o${colors.reset}${colors.brightYellow}  \\
               |     ${colors.bright}^${colors.reset}${colors.brightYellow}     |
               |   ${colors.bright}\\_____/${colors.reset}${colors.brightYellow}   |
                \\  ${colors.orange}'-._.-'${colors.brightYellow}  /
              ${colors.orange}.--${colors.brightYellow}\`-._____.-'${colors.orange}---.
            ${colors.orange}.'${colors.yellow}###${colors.orange}|${colors.brightYellow}  .-.  ${colors.orange}|${colors.yellow}###${colors.orange}\`.
           /${colors.yellow}####${colors.orange}|${colors.brightYellow} ( ${colors.bright}🐝${colors.reset}${colors.brightYellow} ) ${colors.orange}|${colors.yellow}####${colors.orange}\\
          |${colors.yellow}#####${colors.orange}|${colors.brightYellow}  \`-'  ${colors.orange}|${colors.yellow}#####${colors.orange}|
          |${colors.yellow}#####${colors.orange}\`.${colors.yellow}#######${colors.orange}.'${colors.yellow}#####${colors.orange}|
           \\${colors.yellow}##################${colors.orange}/
            \`${colors.yellow}################${colors.orange}'
              ${colors.yellow}\`\`\`\`\`\`\`\`\`\`\`\`${colors.reset}

${colors.brightYellow}${colors.bright}     ██╗   ██╗██╗██████╗ ███████╗███████╗
     ██║   ██║██║██╔══██╗██╔════╝██╔════╝
     ██║   ██║██║██████╔╝█████╗  █████╗
     ╚██╗ ██╔╝██║██╔══██╗██╔══╝  ██╔══╝
      ╚████╔╝ ██║██████╔╝███████╗███████╗
       ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚══════╝${colors.reset}

${colors.orange}          🍯 AI-Powered Vibe Coding 🍯${colors.reset}
`;

// Load environment variables
import { config as loadEnv } from 'dotenv';
loadEnv();
loadEnv({ path: '.env.local', override: true });

// Load Infisical secrets
async function loadInfisicalSecrets() {
  try {
    // Check if infisical.ts exists and load it
    const infisicalModule = await import('../dist/infisical.js');
    if (infisicalModule.initializeInfisical) {
      await infisicalModule.initializeInfisical();
    }
  } catch (error) {
    // Infisical not configured, skip
  }
}

// Get Telegram bot username from env
async function getTelegramBotUsername(): Promise<string | null> {
  // Ensure Infisical secrets are loaded
  await loadInfisicalSecrets();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    return data.ok ? data.result.username : null;
  } catch {
    return null;
  }
}

// Configuration
const config = {
  watchPaths: ['src/**/*.{ts,js,tsx,jsx}'],
  buildCommand: 'bun run build',
  startCommand: 'elizaos start',
  healthCheckUrl: 'http://localhost:3000/health',
  adminPanelUrl: 'http://localhost:3000',
  telegramBotUrl: '', // Will be set dynamically
};

let currentProcess: any = null;
let isRestarting = false;
let startTime = Date.now();
let restartCount = 0;

// Helper functions
function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const timestamp = new Date().toLocaleTimeString('ru-RU');
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.orange}⚠${colors.reset}`,
  }[level];

  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${prefix} ${message}`);
}

function clearScreen() {
  console.clear();
  console.log(logo);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
}

async function showWelcome() {
  clearScreen();

  log(`${colors.bright}Starting Vibee Development Environment...${colors.reset}`, 'info');
  console.log();

  // Get Telegram bot username
  const botUsername = await getTelegramBotUsername();
  if (botUsername) {
    config.telegramBotUrl = `https://t.me/${botUsername}`;
  }

  // Show useful links
  console.log(`${colors.cyan}📚 Quick Links:${colors.reset}`);
  console.log(`   ${colors.gray}Admin Panel:${colors.reset}    ${colors.blue}${config.adminPanelUrl}${colors.reset}`);
  console.log(`   ${colors.gray}Health Check:${colors.reset}   ${colors.blue}${config.healthCheckUrl}${colors.reset}`);

  if (config.telegramBotUrl) {
    console.log(`   ${colors.gray}Telegram Bot:${colors.reset}   ${colors.blue}${config.telegramBotUrl}${colors.reset} ${colors.green}✓${colors.reset}`);
  } else {
    console.log(`   ${colors.gray}Telegram Bot:${colors.reset}   ${colors.red}Not configured${colors.reset}`);
  }
  console.log();

  // Show available commands
  console.log(`${colors.cyan}⌨️  Commands:${colors.reset}`);
  console.log(`   ${colors.gray}Ctrl+C${colors.reset}          Stop server`);
  console.log(`   ${colors.gray}Ctrl+R${colors.reset}          Manual restart`);
  console.log(`   ${colors.gray}rs + Enter${colors.reset}      Quick restart`);
  console.log();

  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
}

async function build() {
  log('Building project...', 'info');

  const buildResult = spawnSync('bun', ['run', 'build'], {
    cwd: resolve(import.meta.dir, '..'),
    stdio: 'inherit',
  });

  if (buildResult.status === 0) {
    log('Build successful!', 'success');
    return true;
  } else {
    log('Build failed!', 'error');
    return false;
  }
}

async function startServer() {
  if (isRestarting) return;

  log('Starting Vibee server...', 'info');

  currentProcess = spawn('elizaos', ['start'], {
    cwd: resolve(import.meta.dir, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  currentProcess.on('exit', (code: number) => {
    if (code !== 0 && !isRestarting) {
      log(`Server exited with code ${code}`, 'error');
    }
  });

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Health check
  try {
    const response = await fetch(config.healthCheckUrl);
    if (response.ok) {
      log('Server is healthy! ✨', 'success');
      showStatus();
    } else {
      log('Server started but health check failed', 'warn');
    }
  } catch (error) {
    log('Server started (health check unavailable)', 'warn');
  }
}

async function stopServer() {
  if (!currentProcess) return;

  log('Stopping server...', 'info');

  return new Promise<void>((resolve) => {
    if (currentProcess) {
      currentProcess.on('exit', () => {
        currentProcess = null;
        resolve();
      });
      currentProcess.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (currentProcess) {
          currentProcess.kill('SIGKILL');
        }
      }, 5000);
    } else {
      resolve();
    }
  });
}

async function restart() {
  if (isRestarting) {
    log('Restart already in progress...', 'warn');
    return;
  }

  isRestarting = true;
  restartCount++;

  log(`Restarting server (attempt #${restartCount})...`, 'info');

  await stopServer();

  const buildSuccess = await build();
  if (!buildSuccess) {
    log('Skipping restart due to build failure', 'error');
    isRestarting = false;
    return;
  }

  await startServer();

  isRestarting = false;
  log('Restart complete!', 'success');
}

function showStatus() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const uptimeStr = `${Math.floor(uptime / 60)}m ${uptime % 60}s`;

  console.log();
  console.log(`${colors.cyan}📊 Status:${colors.reset}`);
  console.log(`   ${colors.gray}Uptime:${colors.reset}         ${uptimeStr}`);
  console.log(`   ${colors.gray}Restarts:${colors.reset}       ${restartCount}`);
  console.log(`   ${colors.gray}Watching:${colors.reset}       ${colors.yellow}${config.watchPaths.join(', ')}${colors.reset}`);
  console.log();
}

function setupFileWatcher() {
  log('File watcher started', 'info');

  const srcDir = resolve(import.meta.dir, '../src');

  watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Filter by extension
    const validExts = ['.ts', '.js', '.tsx', '.jsx'];
    const hasValidExt = validExts.some(ext => filename.endsWith(ext));

    if (!hasValidExt) return;

    log(`File changed: ${colors.yellow}${filename}${colors.reset}`, 'info');
    restart();
  });
}

function setupKeyboardShortcuts() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  let buffer = '';

  process.stdin.on('data', (key: string) => {
    // Ctrl+C - Exit
    if (key === '\u0003') {
      console.log();
      log('Shutting down...', 'info');
      stopServer().then(() => {
        process.exit(0);
      });
      return;
    }

    // Ctrl+R - Restart
    if (key === '\u0012') {
      console.log();
      log('Manual restart triggered', 'info');
      restart();
      return;
    }

    // Handle "rs" + Enter for quick restart
    buffer += key;
    if (buffer.endsWith('rs\n') || buffer.endsWith('rs\r')) {
      console.log();
      log('Quick restart triggered', 'info');
      restart();
      buffer = '';
      return;
    }

    // Clear buffer if it gets too long
    if (buffer.length > 10) {
      buffer = '';
    }
  });
}

// Main execution
async function main() {
  await showWelcome();

  // Initial build and start
  const buildSuccess = await build();
  if (!buildSuccess) {
    log('Initial build failed. Fix errors and try again.', 'error');
    process.exit(1);
  }

  await startServer();

  // Setup watchers
  setupFileWatcher();
  setupKeyboardShortcuts();

  log(`${colors.green}Development server running!${colors.reset}`, 'success');
  log('Watching for file changes...', 'info');
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log();
  log('Received SIGINT, shutting down...', 'info');
  await stopServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log();
  log('Received SIGTERM, shutting down...', 'info');
  await stopServer();
  process.exit(0);
});

// Run
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
