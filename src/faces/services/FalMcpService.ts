/**
 * FAL MCP Service
 * Integration with fal.ai Model Context Protocol for flexible model access
 */

import { Service, IAgentRuntime, ServiceType } from '@elizaos/core';
import {
  GenerateWithFaceInput,
  GenerationResult,
  ServiceResult,
  FaceErrorCode,
  FalGenerationConfig,
  FalGenerationResponse,
  AvatarFace,
} from '../types';
import { FaceDatabaseAdapter } from '../database';
import { FaceManagerService } from './FaceManagerService';
import { v4 as uuidv4 } from 'uuid';

/**
 * FAL MCP Service
 *
 * Provides flexible access to any fal.ai model through the Model Context Protocol (MCP).
 * This service can be extended to support different image generation models beyond FLUX.
 *
 * MCP Documentation: https://docs.fal.ai/model-apis/mcp
 *
 * Supported models:
 * - fal-ai/flux-lora (default)
 * - fal-ai/flux-pro
 * - fal-ai/flux-dev
 * - fal-ai/stable-diffusion-v3
 * - Any other fal.ai model endpoint
 */
export class FalMcpService extends Service {
  static serviceType: ServiceType = 'fal-mcp' as ServiceType;

  private db: FaceDatabaseAdapter;
  private faceManager: FaceManagerService;
  private falApiKey: string;
  private defaultModel = 'fal-ai/flux-lora';

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.db = new FaceDatabaseAdapter(runtime.databaseAdapter);
    this.faceManager = runtime.getService<FaceManagerService>('face-manager' as ServiceType);

    // Get FAL API key from environment
    this.falApiKey = runtime.getSetting('FAL_KEY') || process.env.FAL_KEY || '';

    if (!this.falApiKey) {
      console.warn('FAL_KEY not configured. Image generation will not work.');
    }
  }

  // ============================================================================
  // Image Generation
  // ============================================================================

  /**
   * Generate image with a specific face (LoRA)
   */
  async generateWithFace(input: GenerateWithFaceInput): Promise<ServiceResult<GenerationResult>> {
    try {
      // Validate API key
      if (!this.falApiKey) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.API_ERROR,
            message: 'FAL_KEY not configured',
          },
        };
      }

      // Get face (either by name or default)
      let face: AvatarFace;
      if (input.faceName) {
        const faceResult = await this.faceManager.getFaceByName(input.userId, input.faceName);
        if (!faceResult.success || !faceResult.data) {
          return {
            success: false,
            error: faceResult.error || {
              code: FaceErrorCode.NOT_FOUND,
              message: `Face "${input.faceName}" not found`,
            },
          };
        }
        face = faceResult.data;
      } else {
        const defaultResult = await this.faceManager.getDefaultFace(input.userId);
        if (!defaultResult.success || !defaultResult.data) {
          return {
            success: false,
            error: defaultResult.error || {
              code: FaceErrorCode.NO_DEFAULT_FACE,
              message: 'No default face set',
            },
          };
        }
        face = defaultResult.data;
      }

      // Check if face is ready
      if (face.trainingStatus !== 'ready') {
        return {
          success: false,
          error: {
            code: FaceErrorCode.INVALID_INPUT,
            message: `Face "${face.name}" is not ready (status: ${face.trainingStatus})`,
          },
        };
      }

      // Inject trigger word into prompt if not already present
      const enhancedPrompt = this.injectTriggerWord(input.prompt, face.triggerWord);

      // Build generation config
      const config: FalGenerationConfig = {
        prompt: enhancedPrompt,
        loras: [
          {
            path: face.loraUrl,
            scale: 1.0,
          },
        ],
        image_size: input.imageSize || 'portrait_4_3',
        num_inference_steps: input.numInferenceSteps || 28,
        guidance_scale: input.guidanceScale || 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg',
      };

      // Generate image
      const startTime = Date.now();
      const model = input.model || this.defaultModel;
      const result = await this.callFalModel(model, config);
      const generationTime = Date.now() - startTime;

      if (!result.images || result.images.length === 0) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.GENERATION_FAILED,
            message: 'No images generated',
          },
        };
      }

      const imageUrl = result.images[0].url;
      const generationId = uuidv4();

      // Record generation in database
      await this.db.recordGeneration({
        id: generationId,
        face_id: face.id,
        user_id: input.userId,
        prompt: enhancedPrompt,
        image_url: imageUrl,
        model_used: model,
        generation_time_ms: generationTime,
      });

      // Update face usage
      await this.faceManager.recordUsage(face.id);

      return {
        success: true,
        data: {
          imageUrl,
          faceName: face.name,
          triggerWord: face.triggerWord,
          generationTimeMs: generationTime,
          generationId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.GENERATION_FAILED,
          message: 'Failed to generate image',
          details: error,
        },
      };
    }
  }

  /**
   * Generate image without LoRA (raw model)
   */
  async generateRaw(prompt: string, model?: string, config?: Partial<FalGenerationConfig>): Promise<ServiceResult<string>> {
    try {
      if (!this.falApiKey) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.API_ERROR,
            message: 'FAL_KEY not configured',
          },
        };
      }

      const generationConfig: FalGenerationConfig = {
        prompt,
        image_size: config?.image_size || 'square_hd',
        num_inference_steps: config?.num_inference_steps || 28,
        guidance_scale: config?.guidance_scale || 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg',
        ...config,
      };

      const result = await this.callFalModel(model || this.defaultModel, generationConfig);

      if (!result.images || result.images.length === 0) {
        return {
          success: false,
          error: {
            code: FaceErrorCode.GENERATION_FAILED,
            message: 'No images generated',
          },
        };
      }

      return {
        success: true,
        data: result.images[0].url,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: FaceErrorCode.GENERATION_FAILED,
          message: 'Failed to generate image',
          details: error,
        },
      };
    }
  }

  // ============================================================================
  // FAL Model Context Protocol Integration
  // ============================================================================

  /**
   * Call any fal.ai model through MCP
   *
   * This is the core method that provides flexible access to all fal.ai models.
   * You can extend this to support different model endpoints and configurations.
   */
  private async callFalModel(modelEndpoint: string, config: any): Promise<any> {
    const response = await fetch(`https://fal.run/${modelEndpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${this.falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FAL API error: ${error}`);
    }

    return await response.json();
  }

  /**
   * Get available models (for future expansion)
   */
  async getAvailableModels(): Promise<string[]> {
    return [
      'fal-ai/flux-lora',
      'fal-ai/flux-pro',
      'fal-ai/flux-dev',
      'fal-ai/stable-diffusion-v3',
      'fal-ai/flux-realism',
    ];
  }

  /**
   * Check if a model supports LoRA
   */
  isLoraSupported(model: string): boolean {
    return model.includes('flux') || model.includes('stable-diffusion');
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Inject trigger word into prompt if not already present
   */
  private injectTriggerWord(prompt: string, triggerWord: string): string {
    // Check if trigger word already in prompt (case-insensitive)
    const lowerPrompt = prompt.toLowerCase();
    const lowerTrigger = triggerWord.toLowerCase();

    if (lowerPrompt.includes(lowerTrigger)) {
      return prompt;
    }

    // Add trigger word at the beginning
    return `${triggerWord}, ${prompt}`;
  }

  /**
   * Validate image size configuration
   */
  private validateImageSize(size: any): boolean {
    const validPresets = ['square_hd', 'square', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'];

    if (typeof size === 'string') {
      return validPresets.includes(size);
    }

    if (typeof size === 'object' && size.width && size.height) {
      return size.width > 0 && size.height > 0 && size.width <= 2048 && size.height <= 2048;
    }

    return false;
  }

  /**
   * Get generation history for a face
   */
  async getGenerationHistory(faceId: string, limit: number = 10) {
    return await this.db.getGenerationHistory(faceId, limit);
  }
}
