/**
 * Fal Generation Implementation
 */

import type {
  FalGenerationParams,
  FalResponse,
  FalModel,
} from './types';
import type { ProviderResult } from '../base/types';

const AVAILABLE_MODELS: FalModel[] = [
  // Image Generation
  {
    id: 'fal-ai/flux-lora',
    name: 'Flux LoRA',
    description: 'Flux model with LoRA support for personalization',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'flux', 'lora', 'personalization'],
  },
  {
    id: 'fal-ai/flux-pro',
    name: 'Flux Pro',
    description: 'Professional quality image generation',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'flux', 'pro'],
  },
  {
    id: 'fal-ai/flux-dev',
    name: 'Flux Dev',
    description: 'Development model for testing',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'flux', 'dev'],
  },
  {
    id: 'fal-ai/flux-realism',
    name: 'Flux Realism',
    description: 'Photorealistic image generation',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'flux', 'realism', 'photorealistic'],
  },
  {
    id: 'fal-ai/stable-diffusion-v3',
    name: 'Stable Diffusion V3',
    description: 'High-quality image generation',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'stable-diffusion', 'v3'],
  },
  {
    id: 'fal-ai/flux/schnell',
    name: 'Flux Schnell',
    description: 'Ultra-fast image generation',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'flux', 'fast'],
  },

  // Video Generation
  {
    id: 'fal-ai/stable-video-diffusion-img2vid',
    name: 'Stable Video Diffusion',
    description: 'Generate videos from images',
    contentType: 'video',
    category: 'video',
    tags: ['video', 'img2vid', 'stable-diffusion'],
  },
  {
    id: 'fal-ai/stable-video-diffusion',
    name: 'Text to Video',
    description: 'Generate videos from text prompts',
    contentType: 'video',
    category: 'video',
    tags: ['video', 'text2vid'],
  },
  {
    id: 'fal-ai/hunyuan-video',
    name: 'Hunyuan Video',
    description: 'Tencent\'s video generation model',
    contentType: 'video',
    category: 'video',
    tags: ['video', 'hunyuan', 'tencent'],
  },
  {
    id: 'fal-ai/cogvideo/1.5',
    name: 'CogVideo 1.5',
    description: 'Large-scale video generation',
    contentType: 'video',
    category: 'video',
    tags: ['video', 'cogvideo', 'large-scale'],
  },

  // Audio Generation
  {
    id: 'fal-ai/voice-clone',
    name: 'Voice Clone',
    description: 'Clone voices from audio samples',
    contentType: 'audio',
    category: 'audio',
    tags: ['audio', 'voice', 'clone'],
  },
  {
    id: 'fal-ai/fish-speech-1.5',
    name: 'Fish Speech 1.5',
    description: 'High-quality speech synthesis',
    contentType: 'audio',
    category: 'audio',
    tags: ['audio', 'speech', 'synthesis'],
  },
  {
    id: 'fal-ai/xtts',
    name: 'XTTS',
    description: 'Multilingual text-to-speech',
    contentType: 'audio',
    category: 'audio',
    tags: ['audio', 'tts', 'multilingual'],
  },

  // Image Processing
  {
    id: 'fal-ai/esrgan',
    name: 'ESRGAN Upscaler',
    description: 'Upscale images with AI',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'upscale', 'esrgan'],
  },
  {
    id: 'fal-ai/real-esrgan',
    name: 'Real-ESRGAN',
    description: 'Real-world image upscaling',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'upscale', 'real-world'],
  },
  {
    id: 'fal-ai/gfpgan',
    name: 'GFPGAN',
    description: 'Face restoration and enhancement',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'face', 'restoration'],
  },
  {
    id: 'fal-ai/rembg',
    name: 'Remove BG',
    description: 'Remove image backgrounds',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'background', 'rembg'],
  },
  {
    id: 'fal-ai/segment-anything',
    name: 'Segment Anything',
    description: 'Automatic image segmentation',
    contentType: 'image',
    category: 'image',
    tags: ['image', 'segmentation', 'sam'],
  },
];

/**
 * List available models
 */
export async function listModels(apiKey: string, baseUrl: string): Promise<FalModel[]> {
  // In a real implementation, fetch from Fal API
  // For now, return static list
  return AVAILABLE_MODELS;
}

/**
 * Get model by ID
 */
export async function getModel(
  modelId: string,
  apiKey: string,
  baseUrl: string
): Promise<FalModel | null> {
  const models = await listModels(apiKey, baseUrl);
  return models.find((m) => m.id === modelId) || null;
}

/**
 * Generate content using Fal API
 */
export async function generateContent(
  params: FalGenerationParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const model = params.model || getDefaultModel(params.contentType);
    const modelInfo = await getModel(model, apiKey, baseUrl);

    if (!modelInfo) {
      throw new Error(`Model ${model} not found`);
    }

    const payload = buildPayload(params);
    const response = await fetch(`${baseUrl}/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Fal API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as FalResponse;
    const generationTime = Date.now() - startTime;

    // Extract results based on content type
    const result = extractResult(data, params.contentType);

    return {
      success: true,
      data: result,
      metadata: {
        modelId: model,
        modelName: modelInfo.name,
        contentType: params.contentType,
        seed: data.seed,
        generationTime: generationTime,
        hasNsfw: data.has_nsfw_concepts,
      },
      executionTime: generationTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Get default model for content type
 */
function getDefaultModel(contentType: ContentType): string {
  switch (contentType) {
    case 'image':
      return 'fal-ai/flux-pro';
    case 'video':
      return 'fal-ai/stable-video-diffusion';
    case 'audio':
      return 'fal-ai/fish-speech-1.5';
    default:
      return 'fal-ai/flux-pro';
  }
}

/**
 * Build API payload from parameters
 */
function buildPayload(params: FalGenerationParams): Record<string, any> {
  const payload: Record<string, any> = {
    prompt: params.prompt,
    num_images: params.numImages || 1,
    enable_safety_checker: params.safetyChecker !== false,
    output_format: params.outputFormat || 'jpeg',
  };

  // Image size
  if (params.imageSize) {
    payload.image_size = params.imageSize;
  }

  // Generation parameters
  if (params.numInferenceSteps) {
    payload.num_inference_steps = params.numInferenceSteps;
  }
  if (params.guidanceScale) {
    payload.guidance_scale = params.guidanceScale;
  }
  if (params.seed) {
    payload.seed = params.seed;
  }
  if (params.negativePrompt) {
    payload.negative_prompt = params.negativePrompt;
  }

  // LoRA configuration
  if (params.loras && params.loras.length > 0) {
    payload.loras = params.loras.map((lora) => ({
      path: lora.path,
      scale: lora.scale,
    }));
  }

  return payload;
}

/**
 * Extract result based on content type
 */
function extractResult(data: FalResponse, contentType: ContentType): any {
  switch (contentType) {
    case 'image':
      return data.images || [];

    case 'video':
      return data.videos || [];

    case 'audio':
      return data.audios || [];

    default:
      return data;
  }
}

/**
 * Estimate cost for generation
 */
export function estimateCost(
  modelId: string,
  params: FalGenerationParams
): number {
  const numImages = params.numImages || 1;

  // Basic cost estimation (in USD)
  let costPerUnit = 0.05;

  if (modelId.includes('pro')) {
    costPerUnit = 0.1;
  } else if (modelId.includes('dev') || modelId.includes('schnell')) {
    costPerUnit = 0.025;
  } else if (modelId.includes('realism')) {
    costPerUnit = 0.075;
  } else if (modelId.includes('video')) {
    costPerUnit = 0.5;
  } else if (modelId.includes('audio')) {
    costPerUnit = 0.1;
  }

  return costPerUnit * numImages;
}

/**
 * Get subscription status
 */
export async function getSubscription(
  apiKey: string,
  baseUrl: string
): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/fal/subscription`, {
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get subscription: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Subscription check failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
