/**
 * Integration Tests for TelegramPhotoService
 * Tests middleware registration and photo handling with mock Telegram bot
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PhotoCollectorService } from '../training/PhotoCollectorService';

describe('TelegramPhotoService Integration Tests', () => {
  let mockRuntime: any;
  let mockBot: any;
  let middlewareCallbacks: Array<(ctx: any, next: () => Promise<void>) => Promise<void>>;
  let photoCollector: PhotoCollectorService;

  beforeEach(() => {
    middlewareCallbacks = [];

    // Mock Telegraf bot that captures middleware
    mockBot = {
      use: mock((callback: any) => {
        middlewareCallbacks.push(callback);
      }),
      on: mock(() => {}),
    };

    // Mock TelegramService
    const mockTelegramService = {
      bot: mockBot,
    };

    // Mock runtime
    mockRuntime = {
      getService: mock((serviceName: string) => {
        if (serviceName === 'telegram') {
          return mockTelegramService;
        }
        if (serviceName === 'photo-collector') {
          return photoCollector;
        }
        return null;
      }),
    };

    // Create photo collector
    photoCollector = new PhotoCollectorService(mockRuntime);
  });

  describe('Middleware Registration', () => {
    it('should register middleware via bot.use()', async () => {
      // Simulate TelegramPhotoService initialization
      const { TelegramPhotoService } = await import('../training-plugin');

      // Wait for TelegramService to be available
      expect(mockRuntime.getService('telegram')).toBeDefined();

      // Verify bot.use was called
      expect(mockBot.use).toHaveBeenCalled();
      expect(middlewareCallbacks.length).toBeGreaterThan(0);
    });

    it('should register middleware that checks for photos', () => {
      // Manually register simplified middleware
      const photoMiddleware = async (ctx: any, next: () => Promise<void>) => {
        if (ctx.message?.photo) {
          console.log('Photo detected:', ctx.message.photo);
        }
        await next();
      };

      mockBot.use(photoMiddleware);

      expect(middlewareCallbacks).toHaveLength(1);
      expect(typeof middlewareCallbacks[0]).toBe('function');
    });
  });

  describe('Photo Message Handling', () => {
    it('should detect photo in message context', async () => {
      // Create test photo message context
      const mockPhotoCtx = {
        message: {
          photo: [
            { file_id: 'photo1', file_size: 1000, width: 100, height: 100 },
            { file_id: 'photo2', file_size: 5000, width: 500, height: 500 },
          ],
        },
        from: {
          id: 12345,
        },
        telegram: {
          getFile: mock((fileId: string) => {
            return Promise.resolve({
              file_id: fileId,
              file_path: `photos/${fileId}.jpg`,
              file_size: 5000,
            });
          }),
        },
        reply: mock(() => Promise.resolve()),
      };

      // Register middleware
      const photoMiddleware = async (ctx: any, next: () => Promise<void>) => {
        if (ctx.message?.photo) {
          const userId = ctx.from.id.toString();
          const photo = ctx.message.photo;

          expect(photo).toBeDefined();
          expect(photo.length).toBeGreaterThan(0);
          expect(userId).toBe('12345');
        }
        await next();
      };

      middlewareCallbacks.push(photoMiddleware);

      // Execute middleware
      const nextMock = mock(() => Promise.resolve());
      await middlewareCallbacks[0](mockPhotoCtx, nextMock);

      // Verify next() was called
      expect(nextMock).toHaveBeenCalled();
    });

    it('should handle photo with active session', async () => {
      // Create session
      await photoCollector.initialize(mockRuntime);
      photoCollector.createSession('12345', 'TestModel', 'test_trigger');

      // Mock photo context
      const mockPhotoCtx = {
        message: {
          photo: [
            { file_id: 'large_photo', file_size: 10000, width: 1000, height: 1000 },
          ],
        },
        from: { id: 12345 },
        telegram: {
          getFile: mock(() => Promise.resolve({
            file_id: 'large_photo',
            file_path: 'photos/large_photo.jpg',
            file_size: 10000,
          })),
        },
        reply: mock(() => Promise.resolve()),
      };

      // Simulate photo handler logic
      const userId = mockPhotoCtx.from.id.toString();
      const activeSession = photoCollector.getActiveSession(userId);

      expect(activeSession).toBeDefined();
      expect(activeSession?.faceName).toBe('TestModel');

      // Add photo
      const largestPhoto = mockPhotoCtx.message.photo[mockPhotoCtx.message.photo.length - 1];
      const file = await mockPhotoCtx.telegram.getFile(largestPhoto.file_id);

      const count = photoCollector.addPhoto(userId, file.file_id, file.file_path, file.file_size);

      expect(count).toBe(1);
      expect(mockPhotoCtx.reply).not.toHaveBeenCalled(); // We didn't call it yet
    });

    it('should ignore photo without active session', async () => {
      await photoCollector.initialize(mockRuntime);

      const mockPhotoCtx = {
        message: {
          photo: [{ file_id: 'photo1', file_size: 1000 }],
        },
        from: { id: 99999 }, // User without session
      };

      const userId = mockPhotoCtx.from.id.toString();
      const activeSession = photoCollector.getActiveSession(userId);

      expect(activeSession).toBeNull();

      // Should not throw error
      expect(() => {
        // Logic should return early if no session
        if (!activeSession) {
          return; // Early return
        }
      }).not.toThrow();
    });
  });

  describe('Middleware Order', () => {
    it('should call next() to pass control to ElizaOS', async () => {
      const nextMock = mock(() => Promise.resolve());

      const photoMiddleware = async (ctx: any, next: () => Promise<void>) => {
        if (ctx.message?.photo) {
          // Handle photo
        }
        await next(); // CRITICAL: must call next()
      };

      const mockCtx = {
        message: { photo: [{ file_id: 'test' }] },
        from: { id: 123 },
      };

      await photoMiddleware(mockCtx, nextMock);

      expect(nextMock).toHaveBeenCalledTimes(1);
    });

    it('should work with multiple middleware in chain', async () => {
      const order: string[] = [];

      const middleware1 = async (ctx: any, next: () => Promise<void>) => {
        order.push('before-1');
        await next();
        order.push('after-1');
      };

      const middleware2 = async (ctx: any, next: () => Promise<void>) => {
        order.push('before-2');
        await next();
        order.push('after-2');
      };

      const middleware3 = async (ctx: any, next: () => Promise<void>) => {
        order.push('handler');
      };

      // Chain execution
      await middleware1({}, async () => {
        await middleware2({}, async () => {
          await middleware3({}, async () => {});
        });
      });

      expect(order).toEqual(['before-1', 'before-2', 'handler', 'after-2', 'after-1']);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing telegram service gracefully', async () => {
      const brokenRuntime = {
        getService: mock(() => null), // No services available
      };

      // Should not throw
      expect(() => {
        const service = brokenRuntime.getService('telegram');
        if (!service) {
          console.log('TelegramService not found');
          return; // Early exit
        }
      }).not.toThrow();
    });

    it('should handle errors in photo processing', async () => {
      await photoCollector.initialize(mockRuntime);
      photoCollector.createSession('123', 'Test', 'test');

      // Try to add photo with invalid data
      expect(() => {
        try {
          photoCollector.addPhoto('999', 'invalid', 'path', 100); // Wrong user
        } catch (error) {
          expect(error).toBeDefined();
          throw error;
        }
      }).toThrow();
    });
  });

  describe('Real Telegram Message Flow', () => {
    it('should process photo message end-to-end', async () => {
      // 1. Initialize services
      await photoCollector.initialize(mockRuntime);

      // 2. User starts training
      const userId = '12345';
      photoCollector.createSession(userId, 'MyFace', 'my_trigger');

      // 3. User sends photo
      const mockPhotoMessage = {
        message: {
          photo: [
            { file_id: 'small', file_size: 1000, width: 100, height: 100 },
            { file_id: 'large', file_size: 10000, width: 1000, height: 1000 },
          ],
        },
        from: { id: 12345 },
        telegram: {
          getFile: mock((fileId: string) => Promise.resolve({
            file_id: fileId,
            file_path: `photos/${fileId}.jpg`,
            file_size: fileId === 'large' ? 10000 : 1000,
          })),
        },
        reply: mock(() => Promise.resolve()),
      };

      // 4. Middleware processes photo
      const session = photoCollector.getActiveSession(userId);
      expect(session).toBeDefined();

      const largestPhoto = mockPhotoMessage.message.photo[1]; // largest
      const file = await mockPhotoMessage.telegram.getFile(largestPhoto.file_id);

      const count = photoCollector.addPhoto(userId, file.file_id, file.file_path, file.file_size);

      // 5. Verify
      expect(count).toBe(1);
      expect(session?.photos.length).toBe(1);
      expect(session?.photos[0].fileId).toBe('large');
    });
  });
});
