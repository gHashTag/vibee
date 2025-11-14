import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RainbowBridgeService } from '../src/services/RainbowBridgeService';

describe('RainbowBridgeService', () => {
  let service: RainbowBridgeService;
  let mockRuntime: any;

  beforeEach(() => {
    mockRuntime = {
      getService: vi.fn(),
      getSetting: vi.fn(),
    };

    // Mock environment
    process.env.TELEGRAM_API_ID = '12345';
    process.env.TELEGRAM_API_HASH = 'test_hash';
    process.env.TELEGRAM_SESSION_STRING = 'test_session';
    process.env.RAINBOW_BRIDGE_BOT_USERNAME = 'test_bot';

    service = new RainbowBridgeService(mockRuntime);
  });

  it('should initialize with config', async () => {
    await service.initialize(mockRuntime);
    const status = service.getStatus();

    expect(status.configured).toBe(true);
    expect(status.botUsername).toBe('test_bot');
  });

  it('should return status', () => {
    const status = service.getStatus();

    expect(status).toHaveProperty('enabled');
    expect(status).toHaveProperty('configured');
    expect(status).toHaveProperty('botUsername');
  });

  it('should have correct service type', () => {
    expect(RainbowBridgeService.serviceType).toBe('rainbow-bridge');
  });
});
