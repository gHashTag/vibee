/**
 * Avatar Faces System - Main Export
 * Complete system for managing and using LoRA-based avatar faces
 */

// Types
export * from './types';

// Database
export * from './database';

// Services
export { FaceManagerService } from './services/FaceManagerService';
export { LoraTrainingService } from './services/LoraTrainingService';
export { FalMcpService } from './services/FalMcpService';

// Actions
export { manageFacesAction } from './actions/ManageFacesAction';
export { trainLoraAction } from './actions/TrainLoraAction';

// Plugin configuration
import { Plugin } from '@elizaos/core';
import { FaceManagerService } from './services/FaceManagerService';
import { LoraTrainingService } from './services/LoraTrainingService';
import { FalMcpService } from './services/FalMcpService';
import { manageFacesAction } from './actions/ManageFacesAction';
import { trainLoraAction } from './actions/TrainLoraAction';
import { FaceDatabaseAdapter } from './database';

/**
 * Avatar Faces Plugin
 *
 * Complete plugin for managing LoRA-based avatar faces:
 * - Create and manage multiple faces per user
 * - Train new LoRA models from photos
 * - Generate images with specific faces
 * - Track usage and training status
 */
export const avatarFacesPlugin: Plugin = {
  name: 'avatar-faces',
  description: 'LoRA-based avatar face management system',

  services: [FaceManagerService, LoraTrainingService, FalMcpService],

  actions: [manageFacesAction, trainLoraAction],

  /**
   * Initialize the plugin
   */
  async init(runtime) {
    // Initialize database schema
    await FaceDatabaseAdapter.initialize(runtime);

    console.log('Avatar Faces plugin initialized');
  },
};

export default avatarFacesPlugin;
