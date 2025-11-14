/**
 * Unit Tests for NeuroPhoto Scene
 * Test scene workflow and navigation
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

// Mock Telegram Bot API
const mockTelegram = {
  sendMessage: vi.fn(),
  sendPhoto: vi.fn(),
  sendVideo: vi.fn(),
  editMessageText: vi.fn(),
  deleteMessage: vi.fn(),
};

global.telegram = mockTelegram;

describe('NeuroPhotoScene', () => {
  let NeuroPhotoScene: any;

  beforeAll(async () => {
    const module = await import('../../../src/neurophoto/NeurophotoScene');
    NeuroPhotoScene = module.NeuroPhotoScene;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scene Initialization', () => {
    it('should create scene with correct ID', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      expect(scene.id).toBe('neuroPhotoScene');
      expect(scene.state).toBeDefined();
    });

    it('should initialize with default step', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      expect(scene.currentStep).toBe('welcome');
    });

    it('should handle custom initial state', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
        initialState: {
          model: 'flux-dev',
          quality: '2K',
        },
      });

      expect(scene.state.model).toBe('flux-dev');
      expect(scene.state.quality).toBe('2K');
    });
  });

  describe('Step Navigation', () => {
    it('should transition to model selection', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      scene.transitionTo('modelSelection');

      expect(scene.currentStep).toBe('modelSelection');
      expect(mockTelegram.sendMessage).toHaveBeenCalled();
    });

    it('should validate step transitions', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      const validSteps = ['welcome', 'modelSelection', 'promptInput', 'processing', 'result'];

      validSteps.forEach(step => {
        expect(() => scene.transitionTo(step)).not.toThrow();
      });

      expect(() => scene.transitionTo('invalidStep')).toThrow();
    });

    it('should navigate through complete workflow', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      scene.transitionTo('modelSelection');
      scene.transitionTo('promptInput');
      scene.transitionTo('processing');
      scene.transitionTo('result');

      expect(scene.currentStep).toBe('result');
      expect(scene.state.completed).toBe(true);
    });
  });

  describe('Model Selection', () => {
    it('should show model keyboard', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      scene.showModelSelection();

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].reply_markup).toBeDefined();
    });

    it('should handle model selection callback', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      scene.handleCallback('model:flux-dev', 'test-message-id');

      expect(scene.state.selectedModel).toBe('flux-dev');
      expect(scene.currentStep).toBe('promptInput');
    });

    it('should validate model selection', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      const validModels = ['flux-dev', 'flux-schnell', 'flux-pro', 'seedream'];

      validModels.forEach(model => {
        scene.handleCallback(`model:${model}`, 'message-id');
        expect(scene.state.selectedModel).toBe(model);
      });

      // Reset state
      scene.state = { ...scene.state, selectedModel: undefined };

      expect(() => scene.handleCallback('model:invalid-model', 'message-id')).toThrow();
    });
  });

  describe('Prompt Input', () => {
    it('should show prompt input message', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';

      scene.showPromptInput();

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('Describe your image');
    });

    it('should validate prompt input', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';
      scene.currentStep = 'promptInput';

      const validPrompts = [
        'A beautiful landscape',
        'A cat sitting on a chair',
        'Abstract art in blue colors',
      ];

      validPrompts.forEach(prompt => {
        scene.handleMessage(prompt);
        expect(scene.state.prompt).toBe(prompt);
        expect(scene.currentStep).toBe('processing');
      });
    });

    it('should reject too short prompts', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';
      scene.currentStep = 'promptInput';

      scene.handleMessage('Hi'); // Too short

      expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('too short'),
        })
      );
    });

    it('should reject too long prompts', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';
      scene.currentStep = 'promptInput';

      const longPrompt = 'a'.repeat(500);
      scene.handleMessage(longPrompt);

      expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('too long'),
        })
      );
    });
  });

  describe('Image Processing', () => {
    it('should start image generation', async () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';
      scene.state.prompt = 'A beautiful sunset';

      // Mock the provider
      const mockProvider = {
        generateImage: vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/image.jpg' },
        }),
      };
      scene.setProvider(mockProvider as any);

      await scene.startProcessing();

      expect(mockProvider.generateImage).toHaveBeenCalledWith({
        prompt: 'A beautiful sunset',
        model: 'flux-dev',
      });
      expect(scene.currentStep).toBe('result');
    });

    it('should handle processing error', async () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';
      scene.state.prompt = 'A beautiful sunset';

      const mockProvider = {
        generateImage: vi.fn().mockResolvedValue({
          success: false,
          error: 'API Error',
        }),
      };
      scene.setProvider(mockProvider as any);

      await scene.startProcessing();

      expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('Error'),
        })
      );
      expect(scene.currentStep).toBe('promptInput');
    });

    it('should show progress during processing', async () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';
      scene.state.prompt = 'A beautiful sunset';

      const mockProvider = {
        generateImage: vi.fn().mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve({
            success: true,
            data: { url: 'https://example.com/image.jpg' },
          }), 100);
        })),
      };
      scene.setProvider(mockProvider as any);

      await scene.startProcessing();

      // Check that loading message was sent
      expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: expect.stringContaining('Processing'),
        })
      );
    });
  });

  describe('Result Display', () => {
    it('should show generated image', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.selectedModel = 'flux-dev';
      scene.state.prompt = 'A beautiful sunset';
      scene.state.generatedImageUrl = 'https://example.com/image.jpg';
      scene.state.processingTime = 5000;
      scene.state.cost = 0.05;

      scene.showResult();

      expect(mockTelegram.sendPhoto).toHaveBeenCalledWith(
        expect.any(String),
        'https://example.com/image.jpg',
        expect.objectContaining({
          caption: expect.stringContaining('Model: flux-dev'),
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({ text: 'Regenerate' }),
              ]),
            ]),
          }),
        })
      );
    });

    it('should format processing information correctly', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.generatedImageUrl = 'https://example.com/image.jpg';
      scene.state.processingTime = 3500;
      scene.state.cost = 0.03;

      scene.showResult();

      const callArgs = mockTelegram.sendPhoto.mock.calls[0];
      const caption = callArgs[2].caption;

      expect(caption).toContain('3.5s');
      expect(caption).toContain('$0.03');
    });
  });

  describe('Command Handling', () => {
    it('should handle /cancel command', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.currentStep = 'modelSelection';

      scene.handleCommand('/cancel');

      expect(scene.isCompleted()).toBe(true);
      expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          text: 'Cancelled',
        })
      );
    });

    it('should handle /start command', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      scene.handleCommand('/start');

      expect(scene.currentStep).toBe('welcome');
      expect(mockTelegram.sendMessage).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should save and restore state', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      scene.state.selectedModel = 'flux-dev';
      scene.state.prompt = 'A test prompt';

      const savedState = scene.getState();

      const newScene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
        initialState: savedState,
      });

      expect(newScene.state.selectedModel).toBe('flux-dev');
      expect(newScene.state.prompt).toBe('A test prompt');
    });

    it('should reset state', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      scene.state.selectedModel = 'flux-dev';
      scene.state.prompt = 'A test prompt';

      scene.reset();

      expect(scene.state.selectedModel).toBeUndefined();
      expect(scene.state.prompt).toBeUndefined();
      expect(scene.currentStep).toBe('welcome');
    });
  });

  describe('Validation', () => {
    it('should validate required fields before processing', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });
      scene.state.prompt = 'A test prompt';

      expect(() => scene.validateBeforeProcessing()).toThrow();

      scene.state.selectedModel = 'flux-dev';

      expect(() => scene.validateBeforeProcessing()).not.toThrow();
    });

    it('should check image URL format', () => {
      const scene = new NeuroPhotoScene({
        userId: 'test-user',
        telegram: mockTelegram,
      });

      expect(scene.isValidImageUrl('https://example.com/image.jpg')).toBe(true);
      expect(scene.isValidImageUrl('https://example.com/video.mp4')).toBe(true);
      expect(scene.isValidImageUrl('not-a-url')).toBe(false);
      expect(scene.isValidImageUrl('')).toBe(false);
    });
  });
});
