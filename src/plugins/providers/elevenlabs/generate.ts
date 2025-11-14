/**
 * ElevenLabs Generation Implementation
 */

import type {
  ElevenLabsGenerationParams,
  ElevenLabsVoice,
  VoiceCloneRequest,
  VoiceCloneResponse,
  ElevenLabsSpeechResponse,
  AudioInfo,
} from './types';
import type { ProviderResult } from '../base/types';

/**
 * Default voices
 */
const DEFAULT_VOICES: ElevenLabsVoice[] = [
  {
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'premade',
    description: 'Young American female',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    voiceId: '29vD33N1CtxCmqQRPOHJ',
    name: 'Drew',
    category: 'premade',
    description: 'Neutral male',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    category: 'premade',
    description: 'Middle-aged American male',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    voiceId: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    category: 'premade',
    description: 'Australian accent male',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda',
    category: 'premade',
    description: 'Swedish female',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'premade',
    description: 'Young American male',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Arnold',
    category: 'premade',
    description: 'Deep voice male',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
  {
    voiceId: 'SOYHLrjzK2X1efoUsiCr',
    name: 'Serena',
    category: 'premade',
    description: 'British female',
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
    },
  },
];

/**
 * Default models
 */
const MODELS = [
  'eleven_monolingual_v1',
  'eleven_multilingual_v2',
  'eleven_turbo_v2',
  'eleven_multilingual_v2_5',
];

/**
 * List available voices
 */
export async function listVoices(
  apiKey: string,
  baseUrl: string
): Promise<ElevenLabsVoice[]> {
  try {
    const response = await fetch(`${baseUrl}/v1/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices || DEFAULT_VOICES;
  } catch (error) {
    return DEFAULT_VOICES;
  }
}

/**
 * Get voice by ID
 */
export async function getVoice(
  voiceId: string,
  apiKey: string,
  baseUrl: string
): Promise<ElevenLabsVoice | null> {
  const voices = await listVoices(apiKey, baseUrl);
  return voices.find((v) => v.voiceId === voiceId) || null;
}

/**
 * Generate speech from text
 */
export async function generateSpeech(
  params: ElevenLabsGenerationParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const voiceId = params.voiceId || DEFAULT_VOICES[0].voiceId;
    const modelId = params.modelId || 'eleven_multilingual_v2';

    const voice = await getVoice(voiceId, apiKey, baseUrl);
    if (!voice) {
      throw new Error(`Voice ${voiceId} not found`);
    }

    const payload = {
      text: params.prompt,
      model_id: modelId,
      voice_settings: params.voiceSettings || voice.settings,
    };

    const response = await fetch(`${baseUrl}/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return {
      success: true,
      data: {
        audioBase64: base64Audio,
        format: 'mp3',
        voiceId: voiceId,
        voiceName: voice.name,
      },
      metadata: {
        contentType: 'audio',
        voiceId: voiceId,
        modelId: modelId,
        voiceName: voice.name,
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
 * Clone a voice
 */
export async function cloneVoice(
  request: VoiceCloneRequest,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const formData = new FormData();
    formData.append('name', request.name);

    if (request.description) {
      formData.append('description', request.description);
    }

    if (request.labels) {
      formData.append('labels', JSON.stringify(request.labels));
    }

    for (const fileUrl of request.files) {
      const audioResponse = await fetch(fileUrl);
      if (audioResponse.ok) {
        const audioBuffer = await audioResponse.arrayBuffer();
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        formData.append('files', blob, `sample-${Date.now()}.mp3`);
      }
    }

    const response = await fetch(`${baseUrl}/v1/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Voice cloning failed: ${response.status}`);
    }

    const data = (await response.json()) as VoiceCloneResponse;

    return {
      success: true,
      data,
      metadata: {
        voiceId: data.voiceId,
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
 * Delete a voice
 */
export async function deleteVoice(
  voiceId: string,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const response = await fetch(`${baseUrl}/v1/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    return {
      success: response.ok,
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
 * Get user subscription info
 */
export async function getSubscription(
  apiKey: string,
  baseUrl: string
): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/v1/user`, {
      headers: {
        'xi-api-key': apiKey,
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

/**
 * List audio history
 */
export async function getHistory(
  apiKey: string,
  baseUrl: string,
  pageSize = 100
): Promise<AudioInfo[]> {
  try {
    const response = await fetch(`${baseUrl}/v1/history?page_size=${pageSize}`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get history: ${response.status}`);
    }

    const data = await response.json();
    return data.history || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get audio by ID
 */
export async function getAudio(
  audioId: string,
  apiKey: string,
  baseUrl: string
): Promise<Buffer | null> {
  try {
    const response = await fetch(`${baseUrl}/v1/history/${audioId}`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    return null;
  }
}
