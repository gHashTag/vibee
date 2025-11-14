/**
 * Kie.ai Generation Implementation
 */

import type {
  KieAIGenerationParams,
  KieAIVideoResponse,
  KieAIAudioResponse,
} from './types';
import type { ProviderResult } from '../base/types';

/**
 * Generate content using Kie.ai API
 */
export async function generateContent(
  params: KieAIGenerationParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    switch (params.contentType) {
      case 'video':
        return await generateVideo(params, apiKey, baseUrl, startTime);

      case 'audio':
        return await generateAudio(params, apiKey, baseUrl, startTime);

      default:
        throw new Error(`Unsupported content type: ${params.contentType}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Generate video content
 */
async function generateVideo(
  params: KieAIGenerationParams,
  apiKey: string,
  baseUrl: string,
  startTime: number
): Promise<ProviderResult> {
  const endpoint = `${baseUrl}/api/v1/video/generate`;

  const payload = {
    prompt: params.prompt,
    aspect_ratio: params.aspectRatio || '16:9',
    quality: params.quality || 'high',
    duration: params.duration || 5,
    lora_path: params.loraPath,
    webhook_url: undefined, // Could be added from config
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Kie.ai API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as KieAIVideoResponse;

  // For video generation, we typically get a job ID back
  if (data.status === 'queued' || data.status === 'processing') {
    return {
      success: true,
      data: {
        jobId: data.id,
        status: data.status,
        progress: data.progress || 0,
      },
      metadata: {
        contentType: 'video',
        jobId: data.id,
        status: data.status,
      },
      executionTime: Date.now() - startTime,
    };
  }

  if (data.status === 'completed' && data.videoUrl) {
    return {
      success: true,
      data: {
        url: data.videoUrl,
        jobId: data.id,
        status: data.status,
      },
      metadata: {
        contentType: 'video',
        jobId: data.id,
        status: data.status,
        executionTime: Date.now() - startTime,
      },
      executionTime: Date.now() - startTime,
    };
  }

  throw new Error(`Video generation failed: ${data.error || 'Unknown error'}`);
}

/**
 * Generate audio content
 */
async function generateAudio(
  params: KieAIGenerationParams,
  apiKey: string,
  baseUrl: string,
  startTime: number
): Promise<ProviderResult> {
  const endpoint = `${baseUrl}/api/v1/audio/generate`;

  const payload = {
    text: params.prompt,
    voice_id: params.voiceId || 'default',
    style: params.style || 'natural',
    speed: 1.0,
    pitch: 1.0,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Kie.ai API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as KieAIAudioResponse;

  if (data.status === 'completed' && data.audioUrl) {
    return {
      success: true,
      data: {
        url: data.audioUrl,
        jobId: data.id,
        duration: data.duration,
        status: data.status,
      },
      metadata: {
        contentType: 'audio',
        jobId: data.id,
        duration: data.duration,
      },
      executionTime: Date.now() - startTime,
    };
  }

  if (data.status === 'queued' || data.status === 'processing') {
    return {
      success: true,
      data: {
        jobId: data.id,
        status: data.status,
      },
      metadata: {
        contentType: 'audio',
        jobId: data.id,
      },
      executionTime: Date.now() - startTime,
    };
  }

  throw new Error(`Audio generation failed: ${data.error || 'Unknown error'}`);
}

/**
 * Check job status
 */
export async function checkJobStatus(
  jobId: string,
  contentType: 'video' | 'audio',
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const endpoint = contentType === 'video'
    ? `${baseUrl}/api/v1/video/status/${jobId}`
    : `${baseUrl}/api/v1/audio/status/${jobId}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = contentType === 'video'
      ? (await response.json()) as KieAIVideoResponse
      : (await response.json()) as KieAIAudioResponse;

    return {
      success: true,
      data: {
        jobId: data.id,
        status: data.status,
        progress: data.status === 'processing' ? (data as KieAIVideoResponse).progress : 100,
      },
      metadata: {
        contentType,
        jobId: data.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
