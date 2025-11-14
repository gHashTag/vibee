import { vi } from 'vitest';

// Mock providers
export const mockProviders = {
  fal: {
    generateImage: vi.fn(),
    enhanceImage: vi.fn(),
    upscaleImage: vi.fn(),
  },
  openai: {
    generateText: vi.fn(),
    transcribeAudio: vi.fn(),
  },
  replicate: {
    run: vi.fn(),
    stream: vi.fn(),
  },
  elevenlabs: {
    synthesize: vi.fn(),
    voices: ['voice1', 'voice2'],
  },
  huggingface: {
    generate: vi.fn(),
    classify: vi.fn(),
  },
  runway: {
    generateVideo: vi.fn(),
    editVideo: vi.fn(),
  },
  heygen: {
    createAvatar: vi.fn(),
    generateVideo: vi.fn(),
  },
  midjourney: {
    generate: vi.fn(),
  },
  kie: {
    process: vi.fn(),
  },
  apify: {
    run: vi.fn(),
  },
};

// Mock scenes
export const mockScenes = {
  neuroPhoto: {
    process: vi.fn(),
    train: vi.fn(),
  },
  aiPhotoshop: {
    enhance: vi.fn(),
    style: vi.fn(),
  },
  digitalAvatar: {
    create: vi.fn(),
    animate: vi.fn(),
  },
  faceSwap: {
    swap: vi.fn(),
  },
};

// Mock commands
export const mockCommands = {
  stats: vi.fn(),
  balance: vi.fn(),
  expenseAnalysis: vi.fn(),
  help: vi.fn(),
  invite: vi.fn(),
  language: vi.fn(),
  modelSelect: vi.fn(),
  subscriptionStatus: vi.fn(),
  adminSubscription: vi.fn(),
  autonomousMonitor: vi.fn(),
};

// Test data factories
export const createMockPlugin = () => ({
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  init: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
});

export const createMockMessage = () => ({
  text: 'Test message',
  userId: 'user123',
  chatId: 'chat123',
  timestamp: Date.now(),
});

export const createMockSceneContext = () => ({
  userId: 'user123',
  chatId: 'chat123',
  data: {},
  state: {},
});

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockProviders).forEach((provider) => {
    Object.keys(provider).forEach((key) => {
      const fn = provider[key as keyof typeof provider] as ReturnType<typeof vi.fn>;
      if (fn && typeof fn === 'function') {
        fn.mockClear();
      }
    });
  });

  Object.values(mockScenes).forEach((scene) => {
    Object.keys(scene).forEach((key) => {
      const fn = scene[key as keyof typeof scene] as ReturnType<typeof vi.fn>;
      if (fn && typeof fn === 'function') {
        fn.mockClear();
      }
    });
  });

  Object.values(mockCommands).forEach((cmd) => {
    cmd.mockClear();
  });
};
