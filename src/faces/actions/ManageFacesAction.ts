/**
 * Manage Faces Action
 * Handles all face management commands: list, add, use, delete, status
 */

import { Action, ActionResult, IAgentRuntime, Memory, State } from '@elizaos/core';
import { FaceManagerService } from '../services/FaceManagerService';
import { LoraTrainingService } from '../services/LoraTrainingService';
import { AvatarFace } from '../types';

export const manageFacesAction: Action = {
  name: 'MANAGE_FACES',
  description: 'Manage avatar faces (list, add, use, delete, status)',
  examples: [
    [
      {
        name: '{{user1}}',
        content: {
          text: '/faces',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: 'Here are your avatar faces:\n\n1. **Default Face** (active)\n   - Trigger: `me`\n   - Used: 25 times\n   - Status: Ready\n\n2. **Professional**\n   - Trigger: `prof_me`\n   - Used: 5 times\n   - Status: Ready',
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: '/face add Professional https://storage.fal.ai/lora/xyz123.safetensors prof_me',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: 'Face "Professional" added successfully!\n\nTrigger word: `prof_me`\nStatus: Ready\n\nUse `/face use Professional` to make it your default face.',
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: '/face use Professional',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: '"Professional" is now your active face!\n\nAll images will now use this face unless you specify a different one with `face:name` in your prompt.',
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: '/face delete OldFace',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: 'Face "OldFace" has been deleted.',
        },
      },
    ],
  ],

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase().trim();
    return text.startsWith('/face') || text === '/faces';
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: any, callback?: any): Promise<ActionResult> => {
    try {
      const faceManager = runtime.getService<FaceManagerService>('face-manager' as any);
      const loraTrainer = runtime.getService<LoraTrainingService>('lora-training' as any);

      const userId = message.userId;
      const text = message.content.text.trim();

      // Parse command
      const parsed = parseFaceCommand(text);

      let responseText = '';

      switch (parsed.action) {
        case 'list':
          responseText = await handleListFaces(faceManager, userId);
          break;

        case 'add':
          responseText = await handleAddFace(faceManager, userId, parsed.params);
          break;

        case 'use':
          responseText = await handleUseFace(faceManager, userId, parsed.params);
          break;

        case 'delete':
          responseText = await handleDeleteFace(faceManager, userId, parsed.params);
          break;

        case 'status':
          responseText = await handleStatus(faceManager, loraTrainer, userId, parsed.params);
          break;

        default:
          responseText = getHelpText();
      }

      if (callback) {
        await callback({
          text: responseText,
          action: 'MANAGE_FACES',
        });
      }

      return {
        success: true,
        text: responseText,
      };
    } catch (error) {
      const errorMessage = `Failed to manage faces: ${error instanceof Error ? error.message : String(error)}`;

      if (callback) {
        await callback({
          text: errorMessage,
          error: true,
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};

// ============================================================================
// Command Handlers
// ============================================================================

async function handleListFaces(faceManager: FaceManagerService, userId: string): Promise<string> {
  const result = await faceManager.listFaces({ userId, includeTraining: true });

  if (!result.success || !result.data) {
    return 'Failed to list faces: ' + (result.error?.message || 'Unknown error');
  }

  const { faces, total } = result.data;

  if (faces.length === 0) {
    return `You don't have any avatar faces yet!\n\nGet started:\n- Add a pre-trained LoRA: \`/face add <name> <lora_url> <trigger>\`\n- Train a new face: \`/face train <name> <images_zip_url> <trigger>\``;
  }

  let text = `**Your Avatar Faces** (${total} total)\n\n`;

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    text += formatFaceInfo(face, i + 1);
    text += '\n\n';
  }

  text += `\n**Commands:**\n`;
  text += `- \`/face use <name>\` - Set active face\n`;
  text += `- \`/face delete <name>\` - Delete a face\n`;
  text += `- \`/face status <name>\` - Check training status`;

  return text;
}

async function handleAddFace(faceManager: FaceManagerService, userId: string, params: any): Promise<string> {
  const { name, loraUrl, trigger, description, setDefault } = params;

  if (!name || !loraUrl || !trigger) {
    return 'Usage: `/face add <name> <lora_url> <trigger_word> [description]`\n\nExample:\n`/face add Professional https://storage.fal.ai/lora/xyz.safetensors prof_me "My professional look"`';
  }

  const result = await faceManager.createFace({
    userId,
    name,
    triggerWord: trigger,
    loraUrl,
    description,
    setAsDefault: setDefault,
  });

  if (!result.success) {
    return `Failed to add face: ${result.error?.message || 'Unknown error'}`;
  }

  const face = result.data!;

  return `Face "${face.name}" added successfully!\n\n${formatFaceInfo(face)}\n\nUse \`/face use ${face.name}\` to make it your default face.`;
}

async function handleUseFace(faceManager: FaceManagerService, userId: string, params: any): Promise<string> {
  const { name } = params;

  if (!name) {
    return 'Usage: `/face use <name>`\n\nExample:\n`/face use Professional`';
  }

  // Get face by name first
  const faceResult = await faceManager.getFaceByName(userId, name);
  if (!faceResult.success || !faceResult.data) {
    return `Face "${name}" not found.\n\nUse \`/faces\` to see your available faces.`;
  }

  const face = faceResult.data;

  // Check if face is ready
  if (face.trainingStatus !== 'ready') {
    return `Cannot use "${name}" - it's not ready yet (status: ${face.trainingStatus}).\n\nUse \`/face status ${name}\` to check progress.`;
  }

  // Set as default
  const result = await faceManager.setDefaultFace(userId, face.id);

  if (!result.success) {
    return `Failed to set default face: ${result.error?.message || 'Unknown error'}`;
  }

  return `"${face.name}" is now your active face!\n\nAll images will now use this face unless you specify a different one with \`face:name\` in your prompt.`;
}

async function handleDeleteFace(faceManager: FaceManagerService, userId: string, params: any): Promise<string> {
  const { name } = params;

  if (!name) {
    return 'Usage: `/face delete <name>`\n\nExample:\n`/face delete OldFace`';
  }

  // Get face by name first
  const faceResult = await faceManager.getFaceByName(userId, name);
  if (!faceResult.success || !faceResult.data) {
    return `Face "${name}" not found.\n\nUse \`/faces\` to see your available faces.`;
  }

  const face = faceResult.data;

  // Delete
  const result = await faceManager.deleteFace(face.id);

  if (!result.success) {
    return `Failed to delete face: ${result.error?.message || 'Unknown error'}`;
  }

  return `Face "${name}" has been deleted.`;
}

async function handleStatus(faceManager: FaceManagerService, loraTrainer: LoraTrainingService, userId: string, params: any): Promise<string> {
  const { name } = params;

  if (name) {
    // Status for specific face
    const faceResult = await faceManager.getFaceByName(userId, name);
    if (!faceResult.success || !faceResult.data) {
      return `Face "${name}" not found.`;
    }

    const face = faceResult.data;

    if (face.trainingStatus === 'training') {
      const progressResult = await loraTrainer.getTrainingProgress(face.id);
      if (progressResult.success && progressResult.data) {
        const progress = progressResult.data;
        return `**${face.name}** - Training Status\n\nStatus: ${progress.status}\nProgress: ${progress.progress || '?'}%\n${progress.estimatedTimeRemaining ? `ETA: ${Math.round(progress.estimatedTimeRemaining / 60)} minutes` : ''}`;
      }
    }

    return formatFaceInfo(face);
  } else {
    // Overall stats
    const stats = await faceManager.getTrainingStats(userId);

    return `**Training Statistics**\n\nTotal faces: ${stats.total}\nReady: ${stats.ready}\nTraining: ${stats.training}\nPending: ${stats.pending}\nFailed: ${stats.failed}`;
  }
}

// ============================================================================
// Utilities
// ============================================================================

function parseFaceCommand(text: string): { action: string; params: any } {
  const parts = text.trim().split(/\s+/);

  if (text === '/faces') {
    return { action: 'list', params: {} };
  }

  if (parts[0] !== '/face') {
    return { action: 'unknown', params: {} };
  }

  const action = parts[1]?.toLowerCase();

  switch (action) {
    case 'list':
      return { action: 'list', params: {} };

    case 'add': {
      // /face add <name> <lora_url> <trigger> [description]
      const name = parts[2];
      const loraUrl = parts[3];
      const trigger = parts[4];
      const description = parts.slice(5).join(' ');

      return {
        action: 'add',
        params: { name, loraUrl, trigger, description: description || undefined },
      };
    }

    case 'use': {
      // /face use <name>
      const name = parts.slice(2).join(' ');
      return { action: 'use', params: { name } };
    }

    case 'delete': {
      // /face delete <name>
      const name = parts.slice(2).join(' ');
      return { action: 'delete', params: { name } };
    }

    case 'status': {
      // /face status [name]
      const name = parts.slice(2).join(' ') || undefined;
      return { action: 'status', params: { name } };
    }

    default:
      return { action: 'unknown', params: {} };
  }
}

function formatFaceInfo(face: AvatarFace, index?: number): string {
  let text = '';

  if (index) {
    text += `${index}. `;
  }

  text += `**${face.name}**`;

  if (face.isDefault) {
    text += ' ✓ (active)';
  }

  text += '\n';
  text += `   - Trigger: \`${face.triggerWord}\`\n`;
  text += `   - Status: ${formatStatus(face.trainingStatus)}\n`;

  if (face.usageCount > 0) {
    text += `   - Used: ${face.usageCount} times\n`;
  }

  if (face.description) {
    text += `   - ${face.description}\n`;
  }

  if (face.trainingStatus === 'training') {
    const elapsed = face.trainingStartedAt ? Math.round((Date.now() - face.trainingStartedAt) / 60000) : 0;
    text += `   - Training for ${elapsed} minutes\n`;
  }

  if (face.trainingStatus === 'failed' && face.trainingError) {
    text += `   - Error: ${face.trainingError}\n`;
  }

  return text;
}

function formatStatus(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳ Pending';
    case 'training':
      return '🔄 Training';
    case 'ready':
      return '✅ Ready';
    case 'failed':
      return '❌ Failed';
    default:
      return status;
  }
}

function getHelpText(): string {
  return `**Avatar Faces Commands**

**View Faces:**
\`/faces\` - List all your faces

**Add Face:**
\`/face add <name> <lora_url> <trigger>\` - Add pre-trained LoRA

**Use Face:**
\`/face use <name>\` - Set as default face

**Delete Face:**
\`/face delete <name>\` - Remove a face

**Check Status:**
\`/face status [name]\` - Training progress

**Example:**
\`/face add Professional https://storage.fal.ai/lora/xyz.safetensors prof_me\`
\`/face use Professional\``;
}
