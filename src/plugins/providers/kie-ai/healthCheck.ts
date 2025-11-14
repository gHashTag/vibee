/**
 * Kie.ai Health Check Implementation
 */

import type { PluginHealthStatus } from '../base/types';

/**
 * Perform health check on Kie.ai API
 */
export async function checkKieAIHealth(
  apiKey: string,
  baseUrl: string,
  projectId?: string
): Promise<PluginHealthStatus> {
  const start = Date.now();

  try {
    const endpoint = projectId
      ? `${baseUrl}/api/v1/projects/${projectId}`
      : `${baseUrl}/api/v1/health`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
