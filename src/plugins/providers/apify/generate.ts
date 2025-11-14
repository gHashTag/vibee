/**
 * Apify Generation Implementation
 */

import type {
  ApifyDownloadParams,
  InstagramPost,
} from './types';
import type { ProviderResult } from '../base/types';

/**
 * Download Instagram content
 */
export async function downloadInstagram(
  params: ApifyDownloadParams,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  const startTime = Date.now();

  try {
    const runInput = {
      username: params.url.includes('instagram.com')
        ? params.url.split('/').filter(Boolean).pop()
        : params.url,
      resultsType: params.resultsType || 'posts',
      resultsLimit: params.resultsLimit || 50,
      enhanceSearch: params.enhanceSearch || true,
    };

    const response = await fetch(`${baseUrl}/v2/acts/clockworks~instagram-scraper/runs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ runInput }),
    });

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.status}`);
    }

    const runData = await response.json();

    return {
      success: true,
      data: {
        runId: runData.data.id,
        status: runData.data.status,
        defaultDatasetId: runData.data.defaultDatasetId,
      },
      metadata: {
        contentType: 'video',
        username: runInput.username,
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
 * Get dataset items
 */
export async function getDatasetItems(
  datasetId: string,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const response = await fetch(
      `${baseUrl}/v2/datasets/${datasetId}/items?limit=1000&clean=1`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get dataset: ${response.status}`);
    }

    const items = await response.json();

    return {
      success: true,
      data: items,
      metadata: {
        datasetId,
        itemCount: Array.isArray(items) ? items.length : 0,
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
 * Get run details
 */
export async function getRunDetails(
  runId: string,
  apiKey: string,
  baseUrl: string
): Promise<ProviderResult> {
  try {
    const response = await fetch(`${baseUrl}/v2/acts/clockworks~instagram-scraper/runs/${runId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get run: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data,
      metadata: { runId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
