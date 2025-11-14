import { vi } from 'vitest';

// Provider API mocks
export const mockFalAPI = {
  client: {
    fal: {
      subscribe: vi.fn(),
      run: vi.fn(),
      log: vi.fn(),
    },
  },
};

export const mockReplicateAPI = {
  run: vi.fn(),
  stream: vi.fn(),
};

export const mockOpenAIAPI = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
  audio: {
    transcriptions: {
      create: vi.fn(),
    },
  },
};

export const mockElevenLabsAPI = {
  textToSpeech: vi.fn(),
  getVoices: vi.fn(),
};

export const mockHuggingFaceAPI = {
  run: vi.fn(),
};

export const mockRunwayAPI = {
  gen3a_turbo: {
    run: vi.fn(),
  },
  gen3a_camera_control: {
    run: vi.fn(),
  },
};

export const mockHeyGenAPI = {
  video: {
    avatar: {
      create: vi.fn(),
    },
  },
};

export const mockMidjourneyAPI = {
  submit: vi.fn(),
  get: vi.fn(),
};

export const mockKIEAIAPI = {
  extract: vi.fn(),
};

export const mockApifyAPI = {
  call: vi.fn(),
};
