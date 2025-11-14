/**
 * 🌈 Rainbow Bridge Plugin for ElizaOS
 *
 * Autonomous E2E testing plugin that enables your bot to test itself
 * through real Telegram interactions.
 *
 * @example
 * ```typescript
 * import { rainbowBridgePlugin } from '@elizaos/plugin-rainbow-bridge';
 *
 * export const character: Character = {
 *   // ... your character config
 *   plugins: [
 *     rainbowBridgePlugin,
 *   ],
 * };
 * ```
 *
 * @requires Environment variables:
 * - TELEGRAM_API_ID
 * - TELEGRAM_API_HASH
 * - TELEGRAM_SESSION_STRING
 * - RAINBOW_BRIDGE_BOT_USERNAME (optional)
 */

import { Plugin } from '@elizaos/core';
import { RainbowBridgeService } from './services/RainbowBridgeService';
import { runE2ETestAction } from './actions/run-e2e-test-action';

export const rainbowBridgePlugin: Plugin = {
  name: 'rainbow-bridge',
  description: '🌈 Autonomous E2E testing for Telegram bots via real bot interaction',
  services: [RainbowBridgeService],
  actions: [runE2ETestAction],
};

export default rainbowBridgePlugin;

// Re-export for external usage
export { RainbowBridgeService } from './services/RainbowBridgeService';
export * from './types';
