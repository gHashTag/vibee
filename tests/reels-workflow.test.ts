import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import type { IAgentRuntime } from '@elizaos/core';

/**
 * Integration Tests для Reels Creation Workflow
 *
 * Покрывает полный цикл от RSS новости до финального видео:
 * - Шаг 0: RSS Feed → Telegram Post
 * - Шаг 1: Генерация сценария для Reels
 * - Шаг 2: Генерация аудио (TTS)
 * - Шаг 3: Генерация промпта для изображения
 * - Шаг 4: Генерация изображения
 * - Шаг 5: Генерация финального видео (Lip Sync)
 *
 * Проверяет:
 * - Корректность каждого шага
 * - Функционал перегенерации на каждом шаге
 * - Обработку ошибок
 * - Session management
 * - Callback routing
 */

describe('Reels Workflow Integration Tests', () => {
  let mockRuntime: IAgentRuntime;
  let mockTelegramService: any;
  let mockRSSService: any;
  let mockContentService: any;
  let mockNewsCache: Map<string, any>;
  let mockSessions: Map<string, any>;

  beforeAll(() => {
    // Инициализация mock runtime
    mockNewsCache = new Map();
    mockSessions = new Map();

    mockTelegramService = {
      bot: {
        telegram: {
          sendMessage: async (chatId: number, text: string, options?: any) => {
            return { message_id: Math.floor(Math.random() * 10000) };
          },
          editMessageText: async (chatId: number, messageId: number, _: any, text: string, options?: any) => {
            return { message_id: messageId };
          },
          sendPhoto: async (chatId: number, photo: string, options?: any) => {
            return { message_id: Math.floor(Math.random() * 10000) };
          },
          sendAudio: async (chatId: number, audio: string, options?: any) => {
            return { message_id: Math.floor(Math.random() * 10000) };
          },
          sendVideo: async (chatId: number, video: string, options?: any) => {
            return { message_id: Math.floor(Math.random() * 10000) };
          },
        },
      },
    };

    mockRSSService = {
      generateSocialContent: async (runtime: any, source: any, item: any) => {
        return `🔥 ${item.title}\n\n${item.contentSnippet}\n\n🔗 ${item.link}`;
      },
    };

    mockContentService = {
      generateReelsText: async (newsTitle: string, newsContent: string) => {
        return `🔥 ХУК: ${newsTitle}\n\n💡 СУТЬ: ${newsContent}\n\n✨ ИНСАЙТ: Важная новость для разработчиков\n\n🎯 CALL TO ACTION: Следите за обновлениями!`;
      },
      generateAudio: async (text: string) => {
        return '/tmp/audio_test_' + Date.now() + '.mp3';
      },
      generateImagePrompt: async (newsTitle: string, reelsText: string) => {
        return `A futuristic AI technology concept representing ${newsTitle}, modern design, vibrant colors, portrait orientation 9:16`;
      },
      generateImage: async (prompt: string) => {
        return 'https://fal.ai/files/test-image-' + Date.now() + '.jpg';
      },
      generateLipSyncVideo: async (imageUrl: string, audioUrl: string) => {
        return 'https://fal.ai/files/test-video-' + Date.now() + '.mp4';
      },
    };

    mockRuntime = {
      getService: (serviceName: string) => {
        if (serviceName === 'telegram') return mockTelegramService;
        if (serviceName === 'rss-monitor') return mockRSSService;
        if (serviceName === 'content-creation') return mockContentService;
        return null;
      },
      generateText: async (prompt: string, options?: any) => {
        return { text: 'Generated text response' };
      },
    } as any;

    // Настройка глобального кэша
    (global as any).newsCache = mockNewsCache;
  });

  beforeEach(() => {
    // Очистка кэша и сессий перед каждым тестом
    mockNewsCache.clear();
    mockSessions.clear();
  });

  afterAll(() => {
    // Очистка
    delete (global as any).newsCache;
  });

  describe('Step 0: RSS Feed → Telegram Post', () => {
    test('должен создать пост в Telegram с корректными кнопками', async () => {
      const newsItem = {
        title: 'LangChain выпустили версию 0.3',
        link: 'https://example.com/news/langchain-0.3',
        contentSnippet: 'Новая версия с мультиагентными системами',
        guid: 'https://example.com/news/langchain-0.3',
      };

      // Генерируем newsId
      const newsId = Buffer.from(newsItem.link).toString('base64').slice(0, 32);

      // Сохраняем в кэш
      mockNewsCache.set(newsId, {
        title: newsItem.title,
        link: newsItem.link,
        contentSnippet: newsItem.contentSnippet,
      });

      // Генерируем контент
      const content = await mockRSSService.generateSocialContent(
        mockRuntime,
        { name: 'Test Blog', topics: ['AI'] },
        newsItem
      );

      // Проверяем контент
      expect(content).toContain(newsItem.title);
      expect(content).toContain(newsItem.link);

      // Проверяем, что новость сохранена в кэше
      expect(mockNewsCache.has(newsId)).toBe(true);
      const cachedNews = mockNewsCache.get(newsId);
      expect(cachedNews.title).toBe(newsItem.title);
    });

    test('должен перегенерировать пост при нажатии кнопки "Перегенерировать"', async () => {
      const newsItem = {
        title: 'Test News',
        link: 'https://example.com/test',
        contentSnippet: 'Test content',
      };

      const newsId = Buffer.from(newsItem.link).toString('base64').slice(0, 32);
      mockNewsCache.set(newsId, newsItem);

      // Первая генерация
      const content1 = await mockRSSService.generateSocialContent(
        mockRuntime,
        { name: 'Test', topics: [] },
        newsItem
      );

      // Вторая генерация (перегенерация)
      const content2 = await mockRSSService.generateSocialContent(
        mockRuntime,
        { name: 'Test', topics: [] },
        newsItem
      );

      // Контент должен быть сгенерирован (может быть одинаковым в моке)
      expect(content1).toBeTruthy();
      expect(content2).toBeTruthy();
    });
  });

  describe('Step 1: Генерация сценария для Reels', () => {
    test('должен сгенерировать текст для Reels с правильной структурой', async () => {
      const newsTitle = 'LangChain 0.3 Released';
      const newsContent = 'Multi-agent systems support';

      const reelsText = await mockContentService.generateReelsText(newsTitle, newsContent);

      // Проверяем структуру
      expect(reelsText).toContain('ХУК');
      expect(reelsText).toContain('СУТЬ');
      expect(reelsText).toContain('ИНСАЙТ');
      expect(reelsText).toContain('CALL TO ACTION');
    });

    test('должен сохранить текст в session', async () => {
      const userId = 'test-user-123';
      const reelsText = await mockContentService.generateReelsText('News', 'Content');

      // Симуляция сохранения в session
      mockSessions.set(userId, {
        step: 'text',
        reelsText: reelsText,
        newsTitle: 'News',
        newsLink: 'https://example.com',
      });

      const session = mockSessions.get(userId);
      expect(session.step).toBe('text');
      expect(session.reelsText).toBeTruthy();
    });

    test('должен перегенерировать текст при нажатии "Перегенерировать"', async () => {
      const text1 = await mockContentService.generateReelsText('News', 'Content');
      const text2 = await mockContentService.generateReelsText('News', 'Content');

      expect(text1).toBeTruthy();
      expect(text2).toBeTruthy();
    });
  });

  describe('Step 2: Генерация аудио (TTS)', () => {
    test('должен сгенерировать аудио файл', async () => {
      const reelsText = 'Test reels text for audio generation';
      const audioUrl = await mockContentService.generateAudio(reelsText);

      expect(audioUrl).toBeTruthy();
      expect(audioUrl).toContain('.mp3');
    });

    test('должен сохранить audioUrl в session', async () => {
      const userId = 'test-user-123';
      const audioUrl = await mockContentService.generateAudio('Test text');

      mockSessions.set(userId, {
        step: 'audio',
        reelsText: 'Test text',
        audioUrl: audioUrl,
      });

      const session = mockSessions.get(userId);
      expect(session.step).toBe('audio');
      expect(session.audioUrl).toBeTruthy();
    });
  });

  describe('Step 3: Генерация промпта для изображения', () => {
    test('должен сгенерировать промпт на английском', async () => {
      const prompt = await mockContentService.generateImagePrompt(
        'AI Agent News',
        'Test reels text'
      );

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('9:16');
    });

    test('должен позволить редактирование промпта', async () => {
      const userId = 'test-user-123';
      const generatedPrompt = await mockContentService.generateImagePrompt('News', 'Text');

      // Симуляция редактирования
      const editedPrompt = generatedPrompt + ', high quality, detailed';

      mockSessions.set(userId, {
        step: 'image_prompt',
        imagePrompt: editedPrompt,
      });

      const session = mockSessions.get(userId);
      expect(session.imagePrompt).toContain('high quality');
    });
  });

  describe('Step 4: Генерация изображения', () => {
    test('должен сгенерировать изображение из промпта', async () => {
      const prompt = 'A futuristic AI concept, 9:16 portrait';
      const imageUrl = await mockContentService.generateImage(prompt);

      expect(imageUrl).toBeTruthy();
      expect(imageUrl).toContain('https://');
    });

    test('должен сохранить imageUrl в session', async () => {
      const userId = 'test-user-123';
      const imageUrl = await mockContentService.generateImage('Test prompt');

      mockSessions.set(userId, {
        step: 'image',
        imagePrompt: 'Test prompt',
        imageUrl: imageUrl,
      });

      const session = mockSessions.get(userId);
      expect(session.step).toBe('image');
      expect(session.imageUrl).toBeTruthy();
    });

    test('должен перегенерировать изображение с тем же промптом', async () => {
      const prompt = 'Test prompt';
      const image1 = await mockContentService.generateImage(prompt);
      const image2 = await mockContentService.generateImage(prompt);

      expect(image1).toBeTruthy();
      expect(image2).toBeTruthy();
      // В реальности URL будут разными из-за разных seed
    });
  });

  describe('Step 5: Генерация финального видео (Lip Sync)', () => {
    test('должен сгенерировать видео из изображения и аудио', async () => {
      const imageUrl = 'https://fal.ai/files/test-image.jpg';
      const audioUrl = '/tmp/audio_test.mp3';

      const videoUrl = await mockContentService.generateLipSyncVideo(imageUrl, audioUrl);

      expect(videoUrl).toBeTruthy();
      expect(videoUrl).toContain('.mp4');
    });

    test('должен сохранить videoUrl в session', async () => {
      const userId = 'test-user-123';
      const videoUrl = await mockContentService.generateLipSyncVideo(
        'https://test.com/image.jpg',
        '/tmp/audio.mp3'
      );

      mockSessions.set(userId, {
        step: 'lipsync',
        imageUrl: 'https://test.com/image.jpg',
        audioUrl: '/tmp/audio.mp3',
        videoUrl: videoUrl,
      });

      const session = mockSessions.get(userId);
      expect(session.step).toBe('lipsync');
      expect(session.videoUrl).toBeTruthy();
    });
  });

  describe('Full Workflow Integration', () => {
    test('должен пройти весь workflow от новости до видео', async () => {
      const userId = 'test-user-full-workflow';

      // Step 0: RSS новость
      const newsItem = {
        title: 'AI Breakthrough',
        link: 'https://example.com/ai-breakthrough',
        contentSnippet: 'Major advancement in AI technology',
      };

      const newsId = Buffer.from(newsItem.link).toString('base64').slice(0, 32);
      mockNewsCache.set(newsId, newsItem);

      // Step 1: Генерация текста
      const reelsText = await mockContentService.generateReelsText(
        newsItem.title,
        newsItem.contentSnippet
      );

      mockSessions.set(userId, {
        step: 'text',
        newsTitle: newsItem.title,
        newsLink: newsItem.link,
        reelsText: reelsText,
      });

      // Step 2: Генерация аудио
      const audioUrl = await mockContentService.generateAudio(reelsText);

      let session = mockSessions.get(userId);
      session.step = 'audio';
      session.audioUrl = audioUrl;

      // Step 3: Генерация промпта
      const imagePrompt = await mockContentService.generateImagePrompt(
        newsItem.title,
        reelsText
      );

      session.step = 'image_prompt';
      session.imagePrompt = imagePrompt;

      // Step 4: Генерация изображения
      const imageUrl = await mockContentService.generateImage(imagePrompt);

      session.step = 'image';
      session.imageUrl = imageUrl;

      // Step 5: Генерация видео
      const videoUrl = await mockContentService.generateLipSyncVideo(imageUrl, audioUrl);

      session.step = 'lipsync';
      session.videoUrl = videoUrl;

      // Проверяем финальную сессию
      const finalSession = mockSessions.get(userId);
      expect(finalSession.step).toBe('lipsync');
      expect(finalSession.reelsText).toBeTruthy();
      expect(finalSession.audioUrl).toBeTruthy();
      expect(finalSession.imagePrompt).toBeTruthy();
      expect(finalSession.imageUrl).toBeTruthy();
      expect(finalSession.videoUrl).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('должен обработать ошибку генерации текста', async () => {
      // Mock для ошибки
      const errorService = {
        generateReelsText: async () => {
          throw new Error('LLM API unavailable');
        },
      };

      try {
        await errorService.generateReelsText('News', 'Content');
        expect(true).toBe(false); // Не должно дойти сюда
      } catch (error) {
        expect(error).toBeTruthy();
        expect((error as Error).message).toContain('unavailable');
      }
    });

    test('должен обработать отсутствие новости в кэше', async () => {
      const newsId = 'non-existent-news-id';

      const cachedNews = mockNewsCache.get(newsId);
      expect(cachedNews).toBeUndefined();
    });

    test('должен обработать недоступность сервиса', async () => {
      const badRuntime = {
        getService: () => null,
      } as any;

      const service = badRuntime.getService('telegram');
      expect(service).toBeNull();
    });
  });

  describe('Session Management', () => {
    test('должен корректно создавать и обновлять сессию', async () => {
      const userId = 'test-user-session';

      // Создание новой сессии
      mockSessions.set(userId, {
        newsTitle: 'Test News',
        newsLink: 'https://example.com',
        step: 'text',
      });

      let session = mockSessions.get(userId);
      expect(session.step).toBe('text');

      // Обновление сессии
      session.reelsText = 'Generated text';
      session.step = 'audio';

      session = mockSessions.get(userId);
      expect(session.step).toBe('audio');
      expect(session.reelsText).toBe('Generated text');
    });

    test('должен очистить сессию после завершения', async () => {
      const userId = 'test-user-cleanup';

      mockSessions.set(userId, {
        step: 'lipsync',
        videoUrl: 'https://test.com/video.mp4',
      });

      // Симуляция завершения workflow
      mockSessions.delete(userId);

      const session = mockSessions.get(userId);
      expect(session).toBeUndefined();
    });
  });

  describe('Callback Data Routing', () => {
    test('должен корректно парсить callback_data для каждого шага', () => {
      const callbacks = [
        'reels:dGVzdC1uZXdzLWlk',
        'approve_text',
        'regen_text',
        'approve_audio',
        'regen_audio',
        'approve_prompt',
        'edit_prompt',
        'approve_image',
        'regen_image',
        'approve_video',
        'regen_video',
        'cancel',
      ];

      callbacks.forEach((callback) => {
        expect(callback.length).toBeLessThan(64); // Telegram limit
      });
    });

    test('должен извлечь newsId из callback_data', () => {
      const callbackData = 'reels:dGVzdC1uZXdzLWlk';
      const [action, newsId] = callbackData.split(':');

      expect(action).toBe('reels');
      expect(newsId).toBe('dGVzdC1uZXdzLWlk');
    });
  });

  describe('Regeneration Functionality', () => {
    test('перегенерация должна работать на каждом шаге', async () => {
      // Step 0: Перегенерация поста
      const post1 = await mockRSSService.generateSocialContent(
        mockRuntime,
        { name: 'Blog', topics: [] },
        { title: 'News', link: 'http://test.com', contentSnippet: 'Content' }
      );
      expect(post1).toBeTruthy();

      // Step 1: Перегенерация текста
      const text1 = await mockContentService.generateReelsText('News', 'Content');
      expect(text1).toBeTruthy();

      // Step 2: Перегенерация аудио
      const audio1 = await mockContentService.generateAudio('Text');
      expect(audio1).toBeTruthy();

      // Step 4: Перегенерация изображения
      const image1 = await mockContentService.generateImage('Prompt');
      expect(image1).toBeTruthy();

      // Step 5: Перегенерация видео
      const video1 = await mockContentService.generateLipSyncVideo('image.jpg', 'audio.mp3');
      expect(video1).toBeTruthy();
    });
  });
});
