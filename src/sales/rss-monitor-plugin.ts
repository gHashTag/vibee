import { logger, type IAgentRuntime, type Plugin, Service } from '@elizaos/core';
import Parser from 'rss-parser';
import { vibeCodingResources } from './vibe-coding-knowledge.ts';

logger.info('📡 [RSS MONITOR] Module loaded');

/**
 * RSS Monitor Service - отслеживает новости по AI/vibe-coding
 *
 * Features:
 * - Мониторинг RSS лент топовых блогов
 * - Фильтрация по ключевым словам
 * - Генерация контента для соцсетей
 * - Отправка в Telegram/Instagram/Twitter
 */
class RSSMonitorService extends Service {
  static serviceType = 'rss-monitor';
  capabilityDescription = 'Monitors AI/vibe-coding news and generates social media content';

  private parser: Parser;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 1000 * 60 * 60; // Каждый час
  private readonly KEYWORDS = [
    'ai agent',
    'langchain',
    'eliza',
    'claude',
    'gpt',
    'llm',
    'vibe coding',
    'prompt engineering',
    'rag',
    'autogen',
    'crew ai',
  ];

  constructor(runtime: IAgentRuntime) {
    super();
    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail'],
      },
    });
  }

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new RSSMonitorService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[RSSMonitor] 📡 Initializing RSS monitoring...');

    // Сразу проверяем новости
    await this.checkFeeds(runtime);

    // Настраиваем периодическую проверку
    this.monitorInterval = setInterval(async () => {
      logger.info('[RSSMonitor] ⏰ Scheduled feed check...');
      await this.checkFeeds(runtime);
    }, this.CHECK_INTERVAL_MS);

    logger.info(`[RSSMonitor] ✅ Monitoring enabled (check every ${this.CHECK_INTERVAL_MS / 1000 / 60} minutes)`);
  }

  /**
   * Проверить все RSS ленты
   */
  private async checkFeeds(runtime: IAgentRuntime): Promise<void> {
    logger.info('[RSSMonitor] 🔍 Checking feeds...');

    const feeds = vibeCodingResources.blogs.filter((blog) => blog.rss);

    for (const blog of feeds) {
      try {
        const feed = await this.parser.parseURL(blog.rss!);
        const recentItems = feed.items.slice(0, 5); // Последние 5 постов

        for (const item of recentItems) {
          // Проверяем, интересна ли эта новость
          if (this.isRelevant(item)) {
            await this.processNewsItem(runtime, blog, item);
          }
        }
      } catch (error) {
        logger.error(`[RSSMonitor] ❌ Failed to parse ${blog.name}:`, error);
      }
    }
  }

  /**
   * Проверить, релевантна ли новость
   */
  private isRelevant(item: Parser.Item): boolean {
    const title = item.title?.toLowerCase() || '';
    const content = item.contentSnippet?.toLowerCase() || '';
    const text = `${title} ${content}`;

    // Проверяем ключевые слова
    return this.KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
  }

  /**
   * Обработать новость и создать контент
   */
  private async processNewsItem(
    runtime: IAgentRuntime,
    source: { name: string; topics: string[] },
    item: Parser.Item
  ): Promise<void> {
    // Проверяем, не обрабатывали ли мы уже эту новость
    const newsId = item.guid || item.link;
    if (!newsId) return;

    // TODO: Сохранить в базу, чтобы не дублировать

    logger.info(`[RSSMonitor] 📰 New relevant item: ${item.title}`);

    // Генерируем контент для соцсетей
    const content = await this.generateSocialContent(runtime, source, item);

    // Отправляем в Telegram с кнопками
    await this.postToTelegram(runtime, content, item);

    // TODO: Отправить в Instagram, Twitter
    logger.info('[RSSMonitor] ✅ Content posted to Telegram');
  }

  /**
   * Сгенерировать контент для соцсетей
   */
  async generateSocialContent(
    runtime: IAgentRuntime,
    source: { name: string; topics: string[] },
    item: Parser.Item
  ): Promise<string> {
    // Генерируем хэштеги
    const hashtags = await this.generateHashtags(runtime, item);

    // Формируем промпт для LLM
    const prompt = `
Ты - Vibee, эксперт по AI агентам и vibe-coding. Пишешь на русском языке.

Новость из ${source.name}:
Заголовок: ${item.title}
Описание: ${item.contentSnippet}
Ссылка: ${item.link}

Создай ПРОФЕССИОНАЛЬНЫЙ пост для Telegram на РУССКОМ языке:

СТРУКТУРА:
1. 🔥 Цепляющий заголовок (1 строка)
2. Краткая суть новости (2-3 предложения)
3. 💡 Почему это важно (инсайт для разработчиков)
4. ✨ Практическая ценность (что это дает)
5. 🔗 Ссылка

ФОРМАТ:
- Используй эмодзи УМЕРЕННО (только ключевые моменты)
- Разбивай на абзацы для читаемости
- Профессиональный, но живой стиль
- Без излишнего хайпа

ПРИМЕР:
🚀 LangChain выпустили революционное обновление

Команда LangChain представила версию 0.3 с встроенной поддержкой мультиагентных систем и визуальным редактором графов.

💡 Это меняет подход к разработке AI-агентов. Теперь можно создавать сложные workflow визуально, как в Figma.

✨ Для разработчиков на Python это означает ускорение разработки в 5-10 раз и упрощение поддержки агентных систем.

🔗 Подробности: [ссылка]
`;

    // Генерируем через LLM
    try {
      const response = await runtime.generateText(prompt, {
        modelClass: 'SMALL', // Используем быструю модель
      });

      // response может быть строкой или объектом { text: string }
      const text = typeof response === 'string' ? response : (response as any).text || String(response);

      // Добавляем хэштеги в конец
      return `${text}\n\n${hashtags.join(' ')}`;
    } catch (error) {
      logger.error('[RSSMonitor] Failed to generate content:', error);

      // Fallback - простой формат
      return `📰 ${item.title}

${item.contentSnippet?.slice(0, 200)}...

🔗 ${item.link}

${hashtags.join(' ')}`;
    }
  }

  /**
   * Генерация трендовых хэштегов для новости
   */
  private async generateHashtags(runtime: IAgentRuntime, item: Parser.Item): Promise<string[]> {
    const prompt = `
Ты - эксперт по социальным сетям и трендовым хэштегам.

НОВОСТЬ:
${item.title}
${item.contentSnippet || ''}

ЗАДАЧА: Создай 5-7 релевантных хэштегов для этой новости.

ТРЕБОВАНИЯ:
- На АНГЛИЙСКОМ языке (хэштеги на английском работают лучше)
- Микс из популярных и нишевых хэштегов
- Релевантные теме AI/разработки/технологий
- Без спецсимволов, только буквы и цифры
- Начинаются с #

ПОПУЛЯРНЫЕ ХЭШТЕГИ (используй 2-3):
#AI #MachineLearning #ArtificialIntelligence #Tech #Developer

НИШЕВЫЕ ХЭШТЕГИ (используй 2-3):
#AIAgents #LLM #PromptEngineering #AutoGen #LangChain

СПЕЦИФИЧНЫЕ (используй 1-2):
Создай специфичные хэштеги для этой конкретной новости

Верни ТОЛЬКО хэштеги через пробел, без объяснений:
`;

    try {
      const response = await runtime.generateText(prompt, {
        modelClass: 'SMALL',
      });

      const text = typeof response === 'string' ? response : (response as any).text || String(response);

      // Парсим хэштеги
      const hashtags = text
        .split(/\s+/)
        .filter((tag) => tag.startsWith('#'))
        .map((tag) => tag.trim())
        .slice(0, 7);

      if (hashtags.length > 0) {
        logger.info(`[RSSMonitor] Generated hashtags: ${hashtags.join(' ')}`);
        return hashtags;
      }

      // Fallback
      return ['#AI', '#MachineLearning', '#Tech', '#Developer', '#AIAgents'];
    } catch (error) {
      logger.error('[RSSMonitor] Failed to generate hashtags:', error);
      return ['#AI', '#MachineLearning', '#Tech', '#Developer', '#AIAgents'];
    }
  }

  /**
   * Отправить в Telegram с кнопками для создания контента
   */
  private async postToTelegram(
    runtime: IAgentRuntime,
    content: string,
    item: Parser.Item
  ): Promise<void> {
    try {
      // Получаем Telegram сервис
      const telegramService = runtime.getService('telegram');
      if (!telegramService) {
        logger.warn('[RSSMonitor] Telegram service not available');
        return;
      }

      // Отправляем в админский чат
      const adminChatId = process.env.ADMIN_TELEGRAM_ID;
      if (!adminChatId) {
        logger.warn('[RSSMonitor] ADMIN_TELEGRAM_ID not set');
        return;
      }

      // Создаем уникальный короткий ID для новости (чтобы callback_data был < 64 байта)
      const newsId = Buffer.from(item.link || '').toString('base64').slice(0, 32);

      // Создаем inline кнопки для создания контента
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '📝 Создать сценарий для Reels',
              callback_data: `reels:${newsId}`,
            },
          ],
          [
            {
              text: '🔄 Перегенерировать пост',
              callback_data: `regen_post:${newsId}`,
            },
          ],
        ],
      };

      // Сохраняем полные данные новости для последующего использования
      // TODO: Сохранить в runtime.composeState или базу данных
      (global as any).newsCache = (global as any).newsCache || new Map();
      (global as any).newsCache.set(newsId, {
        title: item.title,
        link: item.link,
        contentSnippet: item.contentSnippet,
      });

      await telegramService.bot.telegram.sendMessage(adminChatId, content, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
        reply_markup: keyboard,
      });

      logger.info('[RSSMonitor] ✅ Posted to Telegram with interactive buttons');
    } catch (error) {
      logger.error('[RSSMonitor] Failed to post to Telegram:', error);
    }
  }
}

export const rssMonitorPlugin: Plugin = {
  name: 'rss-monitor',
  description: 'Monitors AI/vibe-coding news and generates social media content',
  services: [RSSMonitorService],
};

logger.info('📡 [RSS MONITOR] Plugin exported');

export default rssMonitorPlugin;
