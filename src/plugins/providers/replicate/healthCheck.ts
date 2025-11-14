/**
 * Replicate Health Check Implementation
 */

import type { PluginHealthStatus } from '../base/types';

/**
 * Perform health check on Replicate API
 */
export async function checkReplicateHealth(
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    // Try to list models as health check
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`,
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
 * Check prediction status
 */
export async function checkPredictionHealth(
  predictionId: string,
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/v1/predictions/${predictionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${apiKey}`,
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
