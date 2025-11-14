/**
 * HeyGen Health Check Implementation
 */

import type { PluginHealthStatus } from '../base/types';

export async function checkHeyGenHealth(
  apiKey: string,
  baseUrl: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/v2/avatars`, {
      headers: {
        'x-api-key': apiKey,
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
