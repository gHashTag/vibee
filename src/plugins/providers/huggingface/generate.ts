/**
 * HuggingFace Generation Implementation
 */

import type { HFGenerationParams, HFChatParams, HFModel } from './types';
import type { ProviderResult } from '../base/types';

/**
 * List models
 */
export async function listModels(
  apiKey: string,
  baseUrl: string,
  task?: string
): Promise<HFModel[]> {
  try {
    const url = new URL(`${baseUrl}/api/models`);
    if (task) {
      url.searchParams.set('pipeline_tag', task);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return [];
  }
}

/**
 * Generate text
 */
export async function generateText(
  params: HFGenerationParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const model = params.model || 'gpt2';
    const url = `${baseUrl}/models/${model}`;

    const payload = {
      inputs: params.prompt,
      parameters: {
        max_new_tokens: params.maxNewTokens,
        temperature: params.temperature,
        top_p: params.topP,
        do_sample: params.doSample,
      },
      options: {
        wait_for_model: true,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      metadata: {
        model,
        contentType: 'text',
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
 * Chat completion
 */
export async function chatCompletion(
  params: HFChatParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const model = params.model || 'microsoft/DialoGPT-medium';

    const response = await fetch(`${baseUrl}/api/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        inputs: params.inputs,
        parameters: params.parameters,
      }),
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      metadata: {
        model,
        contentType: 'text',
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
 * Get model info
 */
export async function getModel(
  modelId: string,
  apiKey: string,
  baseUrl: string
): Promise<HFModel | null> {
  try {
    const response = await fetch(`${baseUrl}/api/models/${modelId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}
