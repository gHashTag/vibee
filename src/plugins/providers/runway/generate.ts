/**
 * Runway Generation Implementation
 */

import type {
  RunwayGenerationParams,
  RunwayModel,
} from './types';
import type { ProviderResult } from '../base/types';

const MODELS: RunwayModel[] = [
  {
    id: 'gen3a_turbo',
    name: 'Gen-3 Alpha Turbo',
    description: 'Fast video generation',
    input: 'text',
    output: 'video',
  },
  {
    id: 'gen3a',
    name: 'Gen-3 Alpha',
    description: 'High-quality video generation',
    input: 'text',
    output: 'video',
  },
];

export async function listModels(): Promise<RunwayModel[]> {
  return MODELS;
}

export async function generateVideo(
  params: RunwayGenerationParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const model = params.model || 'gen3a_turbo';

    const payload = {
      prompt: params.prompt,
      duration: params.duration || 5,
      ratio: params.ratio || '16:9',
      seed: params.seed,
    };

    const response = await fetch(`${baseUrl}/v1/video/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, model }),
    });

    if (!response.ok) {
      throw new Error(`Runway API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      metadata: {
        model,
        contentType: 'video',
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

export async function checkStatus(
  taskId: string,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const response = await fetch(`${baseUrl}/v1/video/generations/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      metadata: { taskId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
