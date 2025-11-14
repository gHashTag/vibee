/**
 * Provider Plugins Index
 * Main export file for all AI provider plugins
 */

// Base types and utilities
export * from './base/types';
export * from './base/ProviderFactory';
export * from './base/index';

// Provider plugins
export { createKieAIProvider, createKieAIProviderWithFailover } from './kie-ai/Provider';
export { createReplicateProvider, createReplicateImageProvider, createReplicateVideoProvider, createReplicateAudioProvider, createReplicateTextProvider } from './replicate/Provider';
export { createFalProvider, createFalImageProvider, createFalVideoProvider, createFalAudioProvider, createFluxLoRAProvider, createFluxProProvider, createVideoDiffusionProvider } from './fal/Provider';
export { createElevenLabsProvider } from './elevenlabs/Provider';
export { createOpenAIProvider } from './openai/Provider';
export { createHeyGenProvider } from './heygen/Provider';
export { createHuggingFaceProvider } from './huggingface/Provider';
export { createRunwayProvider } from './runway/Provider';
export { createMidjourneyProvider } from './midjourney/Provider';
export { createApifyProvider } from './apify/Provider';

// Quick access to all providers
export const providers = {
  kie: {
    create: createKieAIProvider,
    createWithFailover: createKieAIProviderWithFailover,
  },
  replicate: {
    create: createReplicateProvider,
    createImage: createReplicateImageProvider,
    createVideo: createReplicateVideoProvider,
    createAudio: createReplicateAudioProvider,
    createText: createReplicateTextProvider,
  },
  fal: {
    create: createFalProvider,
    createImage: createFalImageProvider,
    createVideo: createFalVideoProvider,
    createAudio: createFalAudioProvider,
    createFluxLoRA: createFluxLoRAProvider,
    createFluxPro: createFluxProProvider,
    createVideoDiffusion: createVideoDiffusionProvider,
  },
  elevenlabs: {
    create: createElevenLabsProvider,
  },
  openai: {
    create: createOpenAIProvider,
  },
  heygen: {
    create: createHeyGenProvider,
  },
  huggingface: {
    create: createHuggingFaceProvider,
  },
  runway: {
    create: createRunwayProvider,
  },
  midjourney: {
    create: createMidjourneyProvider,
  },
  apify: {
    create: createApifyProvider,
  },
};

// Usage example
/**
 * Usage Example:
 *
 * import {
 *   createKieAIProvider,
 *   createFalProvider,
 *   createOpenAIProvider,
 *   providers,
 * } from '@/plugins/providers';
 *
 * // Basic usage
 * const kieProvider = createKieAIProvider({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.kie.ai',
 * });
 *
 * // Specialized providers
 * const imageProvider = providers.fal.createImage({
 *   apiKey: 'your-api-key',
 * });
 *
 * // With fail-over chain
 * const providerWithFailover = providers.kie.createWithFailover(
 *   {
 *     apiKey: 'kie-api-key',
 *   },
 *   [
 *     {
 *       name: 'replicate',
 *       generate: providers.replicate.create({
 *         apiKey: 'replicate-api-key',
 *       }).generate,
 *     },
 *   ]
 * );
 *
 * // List all providers
 * import { SimplePluginRegistry } from './base/ProviderFactory';
 * const registry = new SimplePluginRegistry();
 * registry.registerProvider(kieProvider);
 * registry.registerProvider(falProvider);
 *
 * const allProviders = registry.listProviders();
 */
