/**
 * ElevenLabs Health Check Implementation
 */

import type { PluginHealthStatus } from '../base/types';

/**
 * Perform health check on ElevenLabs API
 */
export async function checkElevenLabsHealth(
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    // Test with user info endpoint
    const response = await fetch(`${baseUrl}/v1/user`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        healthy: false,
        latency,
        statusCode: response.status,
        lastChecked: new Date(),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      healthy: true,
      latency,
      statusCode: response.status,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check voice availability
 */
export async function checkVoiceHealth(
  voiceId: string,
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        healthy: false,
        latency,
        statusCode: response.status,
        lastChecked: new Date(),
        error: `HTTP ${response.status}`,
      };
    }

    return {
      healthy: true,
      latency,
      statusCode: response.status,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
