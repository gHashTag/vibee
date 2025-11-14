/**
 * Midjourney Generation Implementation
 */

import type { MidjourneyParams } from './types';
import type { ProviderResult } from '../base/types';

export async function generateImage(
  params: MidjourneyParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const payload = {
      prompt: params.prompt,
      aspect_ratio: params.aspectRatio || '1:1',
      version: params.version || 'v6',
      stylize: params.stylize || 100,
      chaos: params.chaos || 0,
      quality: params.quality || 1,
    };

    const response = await fetch(`${baseUrl}/imagine`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Midjourney API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      metadata: {
        contentType: 'image',
        version: payload.version,
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
    const response = await fetch(`${baseUrl}/status/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
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
