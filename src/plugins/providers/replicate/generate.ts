/**
 * Replicate Generation Implementation
 */

import type {
  ReplicateGenerationParams,
  ReplicatePrediction,
  ReplicateModel,
  ReplicatePagination,
} from './types';
import type { ProviderResult } from '../base/types';

const DEFAULT_MODELS: ReplicateModel[] = [
  // Image Generation
  {
    id: 'black-forest-labs/flux-dev',
    name: 'Flux Dev',
    description: 'Fast, high-quality image generation',
    contentType: 'image',
    version: '1.0',
  },
  {
    id: 'black-forest-labs/flux-schnell',
    name: 'Flux Schnell',
    description: 'Ultra-fast image generation',
    contentType: 'image',
    version: '1.0',
  },
  {
    id: 'stability-ai/stable-diffusion-3',
    name: 'SD3',
    description: 'Stability AI\'s latest diffusion model',
    contentType: 'image',
    version: '3.0',
  },
  {
    id: 'prithivModConfigs/Flux-Realism',
    name: 'Flux Realism',
    description: 'Photorealistic image generation',
    contentType: 'image',
    version: '1.0',
  },

  // Video Generation
  {
    id: 'minimax-video/minimax-video-01',
    name: 'Minimax Video',
    description: 'High-quality video generation',
    contentType: 'video',
    version: '1.0',
  },
  {
    id: 'cjwbw/dec году',
    name: 'Video Generation',
    description: 'Text-to-video generation',
    contentType: 'video',
    version: 'latest',
  },

  // Audio Generation
  {
    id: 'sxr_sad_sadness/audioldm2',
    name: 'AudioLDM2',
    description: 'Text-to-audio generation',
    contentType: 'audio',
    version: '2.0',
  },
  {
    id: 'riffusion/riffusion',
    name: 'Riffusion',
    description: 'Music generation from text',
    contentType: 'audio',
    version: '1.0',
  },

  // Text/Chat
  {
    id: 'meta/meta-llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: 'Large language model for text generation',
    contentType: 'text',
    version: '70b',
  },
  {
    id: 'microsoft/wizardlm-2-8x22b',
    name: 'WizardLM 2',
    description: 'Advanced conversational AI',
    contentType: 'text',
    version: '8x22b',
  },
  {
    id: 'mistralai/mixtral-8x7b-instruct-v0.1',
    name: 'Mixtral 8x7B',
    description: 'Mixture of experts model',
    contentType: 'text',
    version: '8x7b',
  },

  // Image-to-Image
  {
    id: 'timbrooks/instruct-pix2pix',
    name: 'Instruct Pix2Pix',
    description: 'Image editing and transformation',
    contentType: 'image',
    version: 'latest',
  },
  {
    id: 'stability-ai/controlnet',
    name: 'ControlNet',
    description: 'Controllable image generation',
    contentType: 'image',
    version: '1.1',
  },

  // Super Resolution
  {
    id: 'ai-forever/RealESRGAN',
    name: 'RealESRGAN',
    description: 'Image upscaling and enhancement',
    contentType: 'image',
    version: 'latest',
  },
  {
    id: 'tencentarc/gfpgan',
    name: 'GFPGAN',
    description: 'Face restoration and enhancement',
    contentType: 'image',
    version: 'latest',
  },

  // Object/Background Removal
  {
    id: 'runwayml/segment-anything',
    name: 'Segment Anything',
    description: 'Automated image segmentation',
    contentType: 'image',
    version: 'latest',
  },
  {
    id: 'cjwbw/rembg',
    name: 'Background Removal',
    description: 'Remove backgrounds from images',
    contentType: 'image',
    version: 'latest',
  },

  // Style Transfer
  {
    id: 'prithivModConfigs/InstantID',
    name: 'InstantID',
    description: 'Identity-preserving generation',
    contentType: 'image',
    version: 'latest',
  },
  {
    id: 'tencentarc/photomaker',
    name: 'PhotoMaker',
    description: 'Person image generation',
    contentType: 'image',
    version: 'latest',
  },

  // Other AI Tools
  {
    id: 'fofr/face-to-many',
    name: 'Face to Many',
    description: 'Convert faces to different styles',
    contentType: 'image',
    version: 'latest',
  },
  {
    id: 'cjwbw/rembg',
    name: 'Remove Background',
    description: 'Remove image backgrounds',
    contentType: 'image',
    version: 'latest',
  },
  {
    id: 'adirik/face-detailer',
    name: 'Face Detailer',
    description: 'Enhance facial details',
    contentType: 'image',
    version: 'latest',
  },
  {
    id: 'pydantic使用者/electric-bookmaker',
    name: 'Image Processing',
    description: 'Various image processing tools',
    contentType: 'image',
    version: 'latest',
  },
];

/**
 * List available models
 */
export async function listModels(apiKey: string, baseUrl: string): Promise<ReplicateModel[]> {
  // In a real implementation, you might fetch from Replicate API
  // For now, return the static list
  return DEFAULT_MODELS;
}

/**
 * Get model by ID
 */
export async function getModel(
  modelId: string,
  apiKey: string,
  baseUrl: string
): Promise<ReplicateModel | null> {
  const models = await listModels(apiKey, baseUrl);
  return models.find((m) => m.id === modelId) || null;
}

/**
 * Generate content using Replicate
 */
export async function generateContent(
  params: ReplicateGenerationParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const modelId = params.model || params.prompt.includes('video')
      ? 'minimax-video/minimax-video-01'
      : params.prompt.includes('audio')
      ? 'riffusion/riffusion'
      : 'black-forest-labs/flux-dev';

    const model = await getModel(modelId, apiKey, baseUrl);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Create prediction
    const prediction = await createPrediction(
      modelId,
      {
        ...params.input,
        prompt: params.prompt,
      },
      apiKey,
      baseUrl,
      params.webhook
    );

    // If waitForCompletion is true, poll for result
    if (params.waitForCompletion) {
      const result = await waitForPrediction(
        prediction.id,
        apiKey,
        baseUrl,
        params.pollInterval || 1000
      );

      return {
        success: result.status === 'succeeded',
        data: result.output || result.error,
        metadata: {
          modelId,
          modelName: model.name,
          contentType: model.contentType,
          predictionId: prediction.id,
          status: result.status,
        },
        executionTime: Date.now() - startTime,
      };
    }

    return {
      success: true,
      data: {
        predictionId: prediction.id,
        status: prediction.status,
      },
      metadata: {
        modelId,
        modelName: model.name,
        contentType: model.contentType,
        predictionId: prediction.id,
      },
      executionTime: Date.now() - startTime,
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
 * Create prediction
 */
async function createPrediction(
  modelId: string,
  input: Record<string, any>,
  apiKey: string,
  baseUrl: string,
  webhook?: string
): Promise<ReplicatePrediction> {
  const response = await fetch(`${baseUrl}/v1/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: undefined, // Could be extracted from model
      input,
      webhook: webhook,
    }),
  });

  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as ReplicatePrediction;
}

/**
 * Wait for prediction to complete
 */
async function waitForPrediction(
  predictionId: string,
  apiKey: string,
  baseUrl: string,
  interval: number
): Promise<ReplicatePrediction> {
  const maxAttempts = 300; // 5 minutes max
  let attempts = 0;

  while (attempts < maxAttempts) {
    const prediction = await getPrediction(predictionId, apiKey, baseUrl);

    if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
      return prediction;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('Prediction timed out');
}

/**
 * Get prediction status
 */
export async function getPrediction(
  predictionId: string,
  apiKey: string,
  baseUrl: string
): Promise<ReplicatePrediction> {
  const response = await fetch(`${baseUrl}/v1/predictions/${predictionId}`, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get prediction: ${response.status}`);
  }

  return (await response.json()) as ReplicatePrediction;
}

/**
 * Cancel prediction
 */
export async function cancelPrediction(
  predictionId: string,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const response = await fetch(`${baseUrl}/v1/predictions/${predictionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    return {
      success: response.ok,
      data: response.ok ? { canceled: true } : undefined,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List user predictions
 */
export async function listPredictions(
  apiKey: string,
  baseUrl: string,
  cursor?: string
): Promise<{ predictions: ReplicatePrediction[]; pagination: ReplicatePagination }> {
  const url = new URL(`${baseUrl}/v1/predictions`);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list predictions: ${response.status}`);
  }

  const data = await response.json();
  return {
    predictions: data.results || [],
    pagination: {
      nextCursor: data.next,
      previousCursor: data.previous,
      hasMore: !!data.next,
    },
  };
}
