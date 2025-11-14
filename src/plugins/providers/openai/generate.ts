/**
 * OpenAI Generation Implementation
 */

import type {
  OpenAIChatParams,
  OpenAIVisionParams,
  OpenAITTSParams,
  OpenAIChatResponse,
  OpenAIEmbeddingResponse,
} from './types';
import type { ProviderResult } from '../base/types';

/**
 * Generate chat completion
 */
export async function generateChat(
  params: OpenAIChatParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const model = params.model || 'gpt-4o';

    const payload = {
      model,
      messages: params.messages,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      n: params.n,
      stop: params.stop,
      presence_penalty: params.presencePenalty,
      frequency_penalty: params.frequencyPenalty,
      logit_bias: params.logitBias,
      user: params.user,
      tools: params.tools,
      tool_choice: params.toolChoice,
      response_format: params.responseFormat,
    };

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenAIChatResponse;

    return {
      success: true,
      data: {
        message: data.choices[0]?.message,
        usage: data.usage,
        finishReason: data.choices[0]?.finish_reason,
      },
      metadata: {
        model: data.model,
        contentType: 'text',
        usage: data.usage,
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
 * Analyze image with vision
 */
export async function analyzeImage(
  params: OpenAIVisionParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const model = params.model || 'gpt-4o-mini';

    const payload = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: params.prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: params.imageUrl,
                detail: params.detail || 'auto',
              },
            },
          ],
        },
      ],
      max_tokens: params.maxTokens || 1000,
    };

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIChatResponse;

    return {
      success: true,
      data: {
        analysis: data.choices[0]?.message?.content,
        usage: data.usage,
      },
      metadata: {
        model: data.model,
        contentType: 'image',
        imageUrl: params.imageUrl,
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
 * Generate speech from text
 */
export async function generateSpeech(
  params: OpenAITTSParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const model = params.model || 'tts-1';
    const voice = params.voice || 'alloy';
    const responseFormat = params.responseFormat || 'mp3';
    const speed = params.speed || 1.0;

    const response = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: params.prompt,
        voice,
        response_format: responseFormat,
        speed,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return {
      success: true,
      data: {
        audioBase64: base64Audio,
        format: responseFormat,
        voice,
      },
      metadata: {
        model,
        voice,
        format: responseFormat,
        contentType: 'audio',
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
 * Generate embeddings
 */
export async function generateEmbeddings(
  input: string | string[],
  model: string,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const payload = {
      model,
      input,
    };

    const response = await fetch(`${baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIEmbeddingResponse;

    return {
      success: true,
      data: data.data,
      metadata: {
        model: data.model,
        contentType: 'text',
        usage: data.usage,
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
 * List models
 */
export async function listModels(apiKey: string, baseUrl: string): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Model listing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get user info
 */
export async function getUser(apiKey: string, baseUrl: string): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/v1/dashboard/billing/subscription`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`User info failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
