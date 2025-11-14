/**
 * HeyGen Generation Implementation
 */

import type {
  HeyGenVideoParams,
  HeyGenVideoResponse,
  HeyGenStreamingParams,
  HeyGenStreamingResponse,
  HeyGenAvatar,
} from './types';
import type { ProviderResult } from '../base/types';

/**
 * List available avatars
 */
export async function listAvatars(
  apiKey: string,
  baseUrl: string
): Promise<HeyGenAvatar[]> {
  try {
    const response = await fetch(`${baseUrl}/v2/avatars`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list avatars: ${response.status}`);
    }

    const data = await response.json();
    return data.avatars || [];
  } catch (error) {
    return [];
  }
}

/**
 * Generate talking avatar video
 */
export async function generateVideo(
  params: HeyGenVideoParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const payload = {
      avatar_id: params.avatar_id,
      voice_id: params.voice_id,
      script: params.script,
      test: params.test || false,
      caption: params.caption || false,
      aspect_ratio: params.aspect_ratio || '16:9',
    };

    const response = await fetch(`${baseUrl}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HeyGen API error: ${response.status}`);
    }

    const data = (await response.json()) as HeyGenVideoResponse;

    return {
      success: true,
      data: {
        videoId: data.video_id,
        status: data.status,
        videoUrl: data.video_url,
      },
      metadata: {
        avatar_id: params.avatar_id,
        contentType: 'video',
        videoId: data.video_id,
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
 * Create streaming avatar
 */
export async function createStreaming(
  params: HeyGenStreamingParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const payload = {
      avatar_id: params.avatar_id,
      voice_id: params.voice_id,
      script: params.script,
    };

    const response = await fetch(`${baseUrl}/v2/streaming_avatar`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HeyGen API error: ${response.status}`);
    }

    const data = (await response.json()) as HeyGenStreamingResponse;

    return {
      success: true,
      data,
      metadata: {
        avatar_id: params.avatar_id,
        contentType: 'video',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check video status
 */
export async function checkVideoStatus(
  videoId: string,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const response = await fetch(`${baseUrl}/v1/video_retrieve?video_id=${videoId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      metadata: {
        videoId,
        status: data.status,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List voices
 */
export async function listVoices(
  apiKey: string,
  baseUrl: string
): Promise<any[]> {
  try {
    const response = await fetch(`${baseUrl}/v1/voice_retrieve`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    return [];
  }
}
