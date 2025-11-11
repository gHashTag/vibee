/**
 * Train LoRA Action
 * Handles training new LoRA models from user photos
 */

import { Action, ActionResult, IAgentRuntime, Memory, State } from '@elizaos/core';
import { LoraTrainingService } from '../services/LoraTrainingService';
import { FaceManagerService } from '../services/FaceManagerService';

export const trainLoraAction: Action = {
  name: 'TRAIN_LORA',
  description: 'Train a new LoRA model from user photos',
  examples: [
    [
      {
        name: '{{user1}}',
        content: {
          text: '/face train MyFace https://example.com/photos.zip my_trigger',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: 'Training started for "MyFace"!\n\n⏱️ Estimated time: 15-20 minutes\n🔄 Status: Training\n\nI\'ll notify you when training completes. You can check progress with:\n`/face status MyFace`',
        },
      },
    ],
    [
      {
        name: '{{user1}}',
        content: {
          text: '/face train',
        },
      },
      {
        name: '{{agent}}',
        content: {
          text: '**Train a New Face**\n\nUsage:\n`/face train <name> <images_zip_url> <trigger_word> [description]`\n\n**Requirements:**\n- ZIP file with 10-20 photos\n- Clear, well-lit face photos\n- Variety of angles and expressions\n- Trigger word (unique identifier)\n\n**Example:**\n`/face train Professional https://my-storage.com/photos.zip prof_me "My professional look"`\n\n**Tips:**\n- Use high-quality photos (min 512x512)\n- Avoid sunglasses or face coverings\n- Include different backgrounds\n- Training takes 15-20 minutes',
        },
      },
    ],
  ],

  validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
    const text = message.content.text.toLowerCase().trim();
    return text.startsWith('/face train');
  },

  handler: async (runtime: IAgentRuntime, message: Memory, state?: State, options?: any, callback?: any): Promise<ActionResult> => {
    try {
      const loraTrainer = runtime.getService<LoraTrainingService>('lora-training' as any);
      const faceManager = runtime.getService<FaceManagerService>('face-manager' as any);

      const userId = message.userId;
      const text = message.content.text.trim();

      // Parse command
      const parsed = parseTrainCommand(text);

      if (!parsed.name || !parsed.imagesZipUrl || !parsed.triggerWord) {
        const helpText = getTrainHelpText();
        if (callback) {
          await callback({
            text: helpText,
            action: 'TRAIN_LORA',
          });
        }
        return {
          success: true,
          text: helpText,
        };
      }

      // Validate inputs
      const validation = validateTrainInputs(parsed);
      if (!validation.valid) {
        if (callback) {
          await callback({
            text: validation.error!,
            error: true,
          });
        }
        return {
          success: false,
          error: new Error(validation.error!),
        };
      }

      // Start training
      const result = await loraTrainer.startTraining({
        userId,
        name: parsed.name,
        imagesZipUrl: parsed.imagesZipUrl,
        triggerWord: parsed.triggerWord,
        description: parsed.description,
        setAsDefault: parsed.setAsDefault,
      });

      if (!result.success) {
        const errorText = `Failed to start training: ${result.error?.message || 'Unknown error'}`;
        if (callback) {
          await callback({
            text: errorText,
            error: true,
          });
        }
        return {
          success: false,
          error: new Error(errorText),
        };
      }

      const face = result.data!;

      const responseText = formatTrainingStarted(face);

      if (callback) {
        await callback({
          text: responseText,
          action: 'TRAIN_LORA',
        });
      }

      return {
        success: true,
        text: responseText,
        values: {
          faceId: face.id,
          faceName: face.name,
          trainingJobId: face.trainingJobId,
        },
      };
    } catch (error) {
      const errorMessage = `Failed to train LoRA: ${error instanceof Error ? error.message : String(error)}`;

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
// Utilities
// ============================================================================

interface ParsedTrainCommand {
  name?: string;
  imagesZipUrl?: string;
  triggerWord?: string;
  description?: string;
  setAsDefault?: boolean;
}

function parseTrainCommand(text: string): ParsedTrainCommand {
  const parts = text.trim().split(/\s+/);

  // /face train <name> <zip_url> <trigger> [description]
  if (parts.length < 3) {
    return {};
  }

  const name = parts[2];
  const imagesZipUrl = parts[3];
  const triggerWord = parts[4];
  const description = parts.slice(5).join(' ');

  return {
    name,
    imagesZipUrl,
    triggerWord,
    description: description || undefined,
    setAsDefault: false,
  };
}

function validateTrainInputs(parsed: ParsedTrainCommand): { valid: boolean; error?: string } {
  // Validate name
  if (!parsed.name || parsed.name.length < 2 || parsed.name.length > 50) {
    return {
      valid: false,
      error: 'Face name must be between 2 and 50 characters.',
    };
  }

  // Validate trigger word
  if (!parsed.triggerWord || parsed.triggerWord.length < 2 || parsed.triggerWord.length > 30) {
    return {
      valid: false,
      error: 'Trigger word must be between 2 and 30 characters.',
    };
  }

  // Validate trigger word format (should be alphanumeric with underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(parsed.triggerWord)) {
    return {
      valid: false,
      error: 'Trigger word can only contain letters, numbers, and underscores.',
    };
  }

  // Validate ZIP URL
  if (!parsed.imagesZipUrl || !isValidUrl(parsed.imagesZipUrl)) {
    return {
      valid: false,
      error: 'Invalid images ZIP URL. Please provide a valid HTTPS URL.',
    };
  }

  if (!parsed.imagesZipUrl.endsWith('.zip')) {
    return {
      valid: false,
      error: 'Images URL must point to a ZIP file (.zip extension).',
    };
  }

  return { valid: true };
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatTrainingStarted(face: any): string {
  return `Training started for "${face.name}"!

⏱️ **Estimated time:** 15-20 minutes
🔄 **Status:** Training
🎯 **Trigger word:** \`${face.triggerWord}\`

I'll notify you when training completes. You can check progress with:
\`/face status ${face.name}\`

**What happens next:**
1. Your photos are being processed
2. LoRA model is being trained
3. Model will be ready for image generation

**Tips while you wait:**
- Training quality depends on photo variety
- 10-20 clear face photos work best
- Different angles and lighting help`;
}

function getTrainHelpText(): string {
  return `**Train a New Avatar Face**

**Usage:**
\`/face train <name> <images_zip_url> <trigger_word> [description]\`

**Parameters:**
- \`name\` - Name for this face (e.g., "Professional", "Casual")
- \`images_zip_url\` - Public URL to ZIP file with photos
- \`trigger_word\` - Unique identifier (e.g., "prof_me", "john_doe")
- \`description\` - Optional description

**Photo Requirements:**
✅ 10-20 photos minimum
✅ Clear, well-lit face shots
✅ Variety of angles and expressions
✅ Minimum 512x512 resolution
✅ JPEG or PNG format

❌ No sunglasses or face coverings
❌ Avoid blurry or low-res photos
❌ Don't use photos with multiple people

**Example:**
\`/face train Professional https://my-storage.com/photos.zip prof_me "My professional headshots"\`

**Training Process:**
1. Photos are uploaded and validated
2. Model training begins (15-20 minutes)
3. LoRA model is saved to your account
4. Face becomes available for generation

**Cost:** Training typically costs $0.50-$1.00 per face

**Tips:**
- Use consistent lighting across photos
- Include some close-ups and medium shots
- Vary your expressions (smiling, serious, etc.)
- Use different backgrounds if possible`;
}
