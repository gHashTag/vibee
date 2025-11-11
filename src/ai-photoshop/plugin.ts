/**
 * AI Photoshop Plugin for ElizaOS
 * Image transformation using Replicate AI models
 */

import { Plugin } from '@elizaos/core';
import { AIPhotoshopService } from './service';
import { aiPhotoshopAction, processImageAction, executeTransformAction } from './action';

/**
 * AI Photoshop Plugin
 *
 * Features:
 * - 7 AI models for image transformation
 * - Camera angles, lighting, and composition presets
 * - Telegram bot integration with keyboard UI
 * - Replicate API integration
 *
 * Usage:
 * 1. User triggers "edit photo" or similar command
 * 2. Bot shows model selection menu
 * 3. User selects model and uploads image
 * 4. User provides editing instructions
 * 5. Bot processes image with AI and returns result
 *
 * Required Environment Variables:
 * - REPLICATE_API_KEY: Your Replicate API token
 */
export const aiPhotoshopPlugin: Plugin = {
  name: 'ai-photoshop',
  description: 'AI-powered image transformation with multiple models and creative controls',

  // Register the service
  services: [AIPhotoshopService],

  // Register actions
  actions: [
    aiPhotoshopAction,      // Main entry point
    processImageAction,     // Handle image uploads
    executeTransformAction, // Execute transformation
  ],

  // No custom providers needed
  providers: [],
};

export default aiPhotoshopPlugin;

/**
 * Example usage in character configuration:
 *
 * import { aiPhotoshopPlugin } from './ai-photoshop';
 *
 * export const character: Character = {
 *   name: 'PhotoBot',
 *   plugins: [
 *     '@elizaos/plugin-bootstrap',
 *     '@elizaos/plugin-sql',
 *     '@elizaos/plugin-openai',
 *     aiPhotoshopPlugin,  // Add AI Photoshop
 *   ],
 *   settings: {
 *     secrets: {
 *       REPLICATE_API_KEY: process.env.REPLICATE_API_KEY,
 *     },
 *   },
 * };
 */
