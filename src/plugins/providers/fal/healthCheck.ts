/**
 * Fal Health Check Implementation
 */

import type { PluginHealthStatus } from '../base/types';

/**
 * Perform health check on Fal API
 */
export async function checkFalHealth(
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    // Test with a simple model call
    const response = await fetch(`${baseUrl}/fal-ai/flux-dev`, {
      method: 'HEAD',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    });

    const latency = Date.now() - start;

    // 405 Method Not Allowed is OK - means API is responding
    if (response.ok || response.status === 405) {
      return {
        healthy: true,
        latency,
        statusCode: response.status,
        lastChecked: new Date(),
      };
    }

    return {
      healthy: false,
      latency,
      statusCode: response.status,
      lastChecked: new Date(),
      error: `HTTP ${response.status}: ${response.statusText}`,
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
 * Check model availability
 */
export async function checkModelHealth(
  modelId: string,
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/${modelId}`, {
      method: 'HEAD',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    });

    const latency = Date.now() - start;

    return {
      healthy: response.ok || response.status === 405,
      latency,
      statusCode: response.status,
      lastChecked: new Date(),
      error: !response.ok && response.status !== 405
        ? `HTTP ${response.status}`
        : undefined,
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
 * Check subscription status
 */
export async function checkSubscriptionHealth(
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/fal/subscription`, {
      headers: {
        Authorization: `Key ${apiKey}`,
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
