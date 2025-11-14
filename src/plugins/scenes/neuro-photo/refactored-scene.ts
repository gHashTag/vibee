/**
 * NeuroPhoto Scene - Refactored with separated UI and business logic
 * Multi-step wizard for AI image generation
 */

import { Markup } from 'telegraf';
import type { Scenes, Context } from 'telegraf';
import { WizardSceneHandler } from '../../core/base-scene';
import type { NeuroPhotoModel } from './types';
import { NeuroPhotoService } from './services/imageService';
import { AVAILABLE_MODELS, IMAGE_STYLES, IMAGE_SIZES } from './types';
import { ValidationError, SceneError } from '../../core/errors';

/**
 * NeuroPhoto Scene Context
 * Properly typed instead of `any`
 */
export interface NeuroPhotoContext extends Context {
  scene: Scenes.SceneContextScene<NeuroPhotoContext>;
  wizard: Scenes.WizardContext<NeuroPhotoContext>;
  session: {
    wizardData?: {
      step: 'model' | 'style' | 'size' | 'generation';
      model?: string;
      prompt?: string;
      settings?: {
        style?: string;
        size?: string;
      };
    };
  };
  update: any; // Telegraf Update type
}

/**
 * NeuroPhoto Generation Service
 * Business logic separated from UI
 */
export class NeuroPhotoBusinessService {
  private imageService: NeuroPhotoService;

  constructor() {
    this.imageService = new NeuroPhotoService();
  }

  /**
   * Validate generation parameters
   */
  validateParams(params: {
    prompt: string;
    model: string;
    settings?: { style?: string; size?: string };
  }): void {
    if (!params.prompt || params.prompt.trim().length < 3) {
      throw new ValidationError('Prompt must be at least 3 characters');
    }

    if (!params.model || !AVAILABLE_MODELS.find(m => m.id === params.model)) {
      throw new ValidationError('Invalid model selected');
    }

    if (params.settings?.style && !IMAGE_STYLES.find(s => s.id === params.settings.style)) {
      throw new ValidationError('Invalid style selected');
    }

    if (params.settings?.size && !IMAGE_SIZES.find(s => s.id === params.settings.size)) {
      throw new ValidationError('Invalid size selected');
    }
  }

  /**
   * Generate image with validation
   */
  async generateImage(
    runtime: any,
    modelId: string,
    prompt: string,
    settings: { style?: string; size?: string }
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    this.validateParams({ model: modelId, prompt, settings });

    const selectedModel = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!selectedModel) {
      throw new SceneError('Model not found', 'neuro-photo', { modelId });
    }

    return this.imageService.generateImage(runtime, selectedModel, prompt, settings);
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): NeuroPhotoModel | undefined {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
  }

  /**
   * Get style by ID
   */
  getStyle(styleId: string): { id: string; name: string; emoji: string } | undefined {
    return IMAGE_STYLES.find(s => s.id === styleId);
  }

  /**
   * Get size by ID
   */
  getSize(sizeId: string): { id: string; name: string; emoji: string } | undefined {
    return IMAGE_SIZES.find(s => s.id === sizeId);
  }

  /**
   * Enhance prompt with settings
   */
  enhancePrompt(prompt: string, settings: { style?: string; size?: string }): string {
    let enhanced = prompt;

    if (settings.style) {
      const style = this.getStyle(settings.style);
      if (style) {
        enhanced += `, style: ${style.name}`;
      }
    }

    if (settings.size) {
      enhanced += `, size: ${settings.size}`;
    }

    return enhanced;
  }
}

/**
 * NeuroPhoto UI Renderer
 * All UI logic separated from business logic
 */
export class NeuroPhotoUIRenderer {
  /**
   * Render model selection message
   */
  renderModelSelection(prompt?: string): string {
    let message = '🎨 <b>Нейро-Фото Генератор</b>\n\n';

    if (prompt) {
      message += `📝 <b>Промпт:</b> ${prompt}\n\n`;
    }

    message += 'Выберите модель для генерации изображения:';
    return message;
  }

  /**
   * Render model selection keyboard
   */
  renderModelKeyboard(): MarkupInlineKeyboardMarkup {
    const buttons = AVAILABLE_MODELS.map((model) => [
      Markup.button.callback(
        `${model.emoji} ${model.name}`,
        `model_${model.id}`
      ),
    ]);

    return Markup.inlineKeyboard(buttons).parseMarkup();
  }

  /**
   * Render style selection message
   */
  renderStyleSelection(model: NeuroPhotoModel): string {
    return `✅ Модель выбрана: <b>${model.name}</b>\n\n` +
           `Теперь выберите стиль изображения:`;
  }

  /**
   * Render style selection keyboard
   */
  renderStyleKeyboard(): MarkupInlineKeyboardMarkup {
    const buttons = IMAGE_STYLES.map((style) => [
      Markup.button.callback(
        `${style.emoji} ${style.name}`,
        `style_${style.id}`
      ),
    ]);

    return Markup.inlineKeyboard(buttons).parseMarkup();
  }

  /**
   * Render size selection message
   */
  renderSizeSelection(styleName: string): string {
    return `✅ Стиль выбран: <b>${styleName}</b>\n\n` +
           `Выберите размер изображения:`;
  }

  /**
   * Render size selection keyboard
   */
  renderSizeKeyboard(): MarkupInlineKeyboardMarkup {
    const buttons = IMAGE_SIZES.map((size) => [
      Markup.button.callback(
        `${size.emoji} ${size.name}`,
        `size_${size.id}`
      ),
    ]);

    return Markup.inlineKeyboard(buttons).parseMarkup();
  }

  /**
   * Render generation result
   */
  renderGenerationResult(
    model: NeuroPhotoModel,
    styleName: string,
    sizeName: string,
    prompt: string
  ): string {
    return `✨ <b>Готово!</b>\n\n` +
           `Модель: ${model.name}\n` +
           `Стиль: ${styleName}\n` +
           `Размер: ${sizeName}\n\n` +
           `Промпт: ${prompt}`;
  }

  /**
   * Render error message
   */
  renderError(error: string): string {
    return `❌ Ошибка генерации: ${error}\n\n` +
           'Попробуйте еще раз или измените параметры.';
  }

  /**
   * Render waiting message
   */
  renderWaiting(): string {
    return '⏳ Генерирую изображение, пожалуйста подождите...';
  }
}

/**
 * NeuroPhoto Scene Handler
 * Orchestrates UI and business logic
 */
export class NeuroPhotoSceneHandler extends WizardSceneHandler<NeuroPhotoContext> {
  private businessService: NeuroPhotoBusinessService;
  private uiRenderer: NeuroPhotoUIRenderer;

  constructor(runtime: any) {
    super(runtime, {
      name: 'neuroPhoto',
      ttl: 300000, // 5 minutes
      maxSteps: 4,
      retries: 2,
      enableCache: true,
    }, []);

    this.businessService = new NeuroPhotoBusinessService();
    this.uiRenderer = new NeuroPhotoUIRenderer();

    // Define scene steps
    this.steps = [
      // Step 0: Model Selection
      {
        handler: this.handleModelSelection.bind(this),
        validator: this.validateModelSelection.bind(this),
      },
      // Step 1: Style Selection
      {
        handler: this.handleStyleSelection.bind(this),
        validator: this.validateStyleSelection.bind(this),
      },
      // Step 2: Size Selection
      {
        handler: this.handleSizeSelection.bind(this),
        validator: this.validateSizeSelection.bind(this),
      },
      // Step 3: Generation
      {
        handler: this.handleGeneration.bind(this),
        onError: this.handleGenerationError.bind(this),
      },
    ];
  }

  /**
   * Validate model selection step
   */
  validateInput(ctx: NeuroPhotoContext): boolean {
    const state = this.getSceneState(ctx);
    return state.step === 0 || state.step === undefined;
  }

  /**
   * Process input for current step
   */
  async processInput(ctx: NeuroPhotoContext): Promise<void> {
    await this.executeCurrentStep(ctx);
  }

  /**
   * Handle model selection
   */
  private async handleModelSelection(ctx: NeuroPhotoContext): Promise<void> {
    // Initialize session data
    const state = this.getSceneState(ctx, {
      step: 'model' as const,
      model: '',
      prompt: '',
      settings: {},
    });

    // Get pending prompt from memory
    const userId = ctx.from?.id?.toString() || 'unknown';
    const memories = await ctx.bot.context.runtime.getMemories({
      where: [{ userId }, { type: 'text' }],
      limit: 1,
    });

    if (memories.length > 0 && !state.prompt) {
      state.prompt = memories[0].content?.text || '';
    }

    this.updateSceneState(ctx, state);

    // Render UI
    await ctx.reply(
      this.uiRenderer.renderModelSelection(state.prompt),
      this.uiRenderer.renderModelKeyboard()
    );
  }

  /**
   * Validate model selection
   */
  private validateModelSelection(ctx: NeuroPhotoContext): boolean {
    return !!ctx.update?.callback_query?.data?.startsWith('model_');
  }

  /**
   * Handle style selection
   */
  private async handleStyleSelection(ctx: NeuroPhotoContext): Promise<void> {
    const state = this.getSceneState(ctx);

    // Handle model callback
    if (ctx.update?.callback_query?.data?.startsWith('model_')) {
      const modelId = ctx.update.callback_query.data.replace('model_', '');
      state.model = modelId;
      state.step = 'style';
      this.updateSceneState(ctx, state);
    }

    const model = this.businessService.getModel(state.model!);
    if (!model) {
      throw new SceneError('Model not found', 'neuro-photo');
    }

    // Render UI
    await ctx.reply(
      this.uiRenderer.renderStyleSelection(model),
      this.uiRenderer.renderStyleKeyboard()
    );
  }

  /**
   * Validate style selection
   */
  private validateStyleSelection(ctx: NeuroPhotoContext): boolean {
    return !!ctx.update?.callback_query?.data?.startsWith('style_');
  }

  /**
   * Handle size selection
   */
  private async handleSizeSelection(ctx: NeuroPhotoContext): Promise<void> {
    const state = this.getSceneState(ctx);

    // Handle style callback
    if (ctx.update?.callback_query?.data?.startsWith('style_')) {
      const styleId = ctx.update.callback_query.data.replace('style_', '');
      state.settings = state.settings || {};
      state.settings.style = styleId;
      state.step = 'size';
      this.updateSceneState(ctx, state);
    }

    const style = this.businessService.getStyle(state.settings!.style!);
    if (!style) {
      throw new SceneError('Style not found', 'neuro-photo');
    }

    // Render UI
    await ctx.reply(
      this.uiRenderer.renderSizeSelection(style.name),
      this.uiRenderer.renderSizeKeyboard()
    );
  }

  /**
   * Validate size selection
   */
  private validateSizeSelection(ctx: NeuroPhotoContext): boolean {
    return !!ctx.update?.callback_query?.data?.startsWith('size_');
  }

  /**
   * Handle image generation
   */
  private async handleGeneration(ctx: NeuroPhotoContext): Promise<void> {
    const state = this.getSceneState(ctx);

    // Handle size callback
    if (ctx.update?.callback_query?.data?.startsWith('size_')) {
      const sizeId = ctx.update.callback_query.data.replace('size_', '');
      state.settings = state.settings || {};
      state.settings.size = sizeId;
      this.updateSceneState(ctx, state);
    }

    // Send waiting message
    await ctx.reply(this.uiRenderer.renderWaiting());

    try {
      // Generate image using business service
      const result = await this.businessService.generateImage(
        ctx.bot.context.runtime,
        state.model!,
        state.prompt!,
        state.settings!
      );

      if (result.success && result.url) {
        // Get model, style, and size names
        const model = this.businessService.getModel(state.model!)!;
        const style = this.businessService.getStyle(state.settings!.style!)!;
        const size = this.businessService.getSize(state.settings!.size!)!;

        // Render result
        await ctx.replyWithPhoto(result.url, {
          caption: this.uiRenderer.renderGenerationResult(
            model,
            style.name,
            size.name,
            state.prompt!
          ),
          parseMode: 'HTML',
        });

        // Leave scene
        await this.leaveScene(ctx);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle generation errors
   */
  private async handleGenerationError(ctx: NeuroPhotoContext, error: Error): Promise<void> {
    await ctx.reply(this.uiRenderer.renderError(error.message));
    await this.leaveScene(ctx);
  }

  /**
   * Handle errors in scene
   */
  async handleError(ctx: NeuroPhotoContext, error: Error): Promise<void> {
    await ctx.reply(this.uiRenderer.renderError(error.message));

    if (ctx.scene) {
      await ctx.scene.leave();
    }
  }
}

/**
 * Create NeuroPhoto Scene
 */
export function createNeuroPhotoScene(runtime: any): Scenes.WizardScene<NeuroPhotoContext> {
  const handler = new NeuroPhotoSceneHandler(runtime);

  return new Scenes.WizardScene<NeuroPhotoContext>(
    'neuroPhoto',

    // Step 0: Model Selection
    async (ctx) => {
      await handler.enter(ctx);
    },

    // Step 1: Style Selection
    async (ctx) => {
      await handler.handleCallback(ctx);
    },

    // Step 2: Size Selection
    async (ctx) => {
      await handler.handleCallback(ctx);
    },

    // Step 3: Generation
    async (ctx) => {
      await handler.handleCallback(ctx);
    }
  );
}

// Helper type for inline keyboard markup
type MarkupInlineKeyboardMarkup = ReturnType<typeof Markup.inlineKeyboard>['reply_markup'];
