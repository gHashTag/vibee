/**
 * 📰 News Monitor Plugin - Умный мониторинг новостей про vibe-coding
 *
 * Особенности:
 * - ✅ Дедупликация через БД
 * - ✅ Качественные источники новостей
 * - ✅ Умная фильтрация по ключевым словам
 * - ✅ Отправка каждый час в личку пользователю
 * - ✅ Красивое форматирование с кнопками
 */

import { logger, type IAgentRuntime, type Plugin, Service } from '@elizaos/core';
import Parser from 'rss-parser';

// ========================================
// СХЕМА БАЗЫ ДАННЫХ
// ========================================

interface NewsItem {
  id?: number;
  guid: string;
  title: string;
  link: string;
  description: string;
  source: string;
  publishedAt: Date;
  topics: string[];
  sentToChat: boolean;
  createdAt: Date;
}

// ========================================
// SERVICE
// ========================================

class NewsMonitorService extends Service {
  static serviceType = 'news-monitor';
  capabilityDescription = 'Мониторит новости по vibe-coding и отправляет в Telegram';

  private parser: Parser;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 1000 * 60 * 60; // Каждый час
  private get ADMIN_CHAT_ID(): string {
    return process.env.ADMIN_CHAT_ID || '144062800'; // Чат для отправки новостей
  }

  // Качественные источники новостей
  private readonly NEWS_SOURCES = [
    {
      name: 'LangChain Blog',
      url: 'https://blog.langchain.dev',
      rss: 'https://blog.langchain.dev/rss/',
      keywords: ['langchain', 'agent', 'ai', 'llm'],
      priority: 'high',
    },
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog',
      rss: 'https://openai.com/blog/rss.xml',
      keywords: ['gpt', 'openai', 'ai', 'model'],
      priority: 'high',
    },
    {
      name: 'Anthropic Blog',
      url: 'https://www.anthropic.com/news',
      rss: 'https://www.anthropic.com/news/rss.xml',
      keywords: ['claude', 'anthropic', 'ai', 'safety'],
      priority: 'high',
    },
    {
      name: 'AI Agent News',
      url: 'https://www.aiagent.news',
      rss: 'https://www.aiagent.news/rss',
      keywords: ['agent', 'ai agent', 'multi-agent', 'autonomous'],
      priority: 'high',
    },
    {
      name: 'Towards Data Science',
      url: 'https://towardsdatascience.com',
      rss: 'https://towardsdatascience.com/feed',
      keywords: ['machine learning', 'ai', 'data science', 'python'],
      priority: 'medium',
    },
    {
      name: 'JavaScript Weekly',
      url: 'https://javascriptweekly.com',
      rss: 'https://javascriptweekly.com/rss',
      keywords: ['javascript', 'node.js', 'web development', 'frontend'],
      priority: 'medium',
    },
    {
      name: 'Hacker News',
      url: 'https://news.ycombinator.com',
      rss: 'https://hnrss.org/frontpage',
      keywords: ['programming', 'startup', 'technology', 'ai'],
      priority: 'medium',
    },
    {
      name: 'Dev.to',
      url: 'https://dev.to',
      rss: 'https://dev.to/feed',
      keywords: ['programming', 'javascript', 'ai', 'web dev'],
      priority: 'medium',
    },
  ];

  // Ключевые слова для фильтрации релевантных новостей
  private readonly RELEVANT_KEYWORDS = [
    // AI & ML
    'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
    'llm', 'large language model', 'gpt', 'claude', 'gemini', 'chatgpt',
    'openai', 'anthropic', 'google ai', 'microsoft ai',

    // Агенты
    'ai agent', 'autonomous agent', 'multi-agent', 'agent system', 'agent framework',
    'langchain', 'autogen', 'crewai', 'elizaos', 'agentic ai',

    // Разработка
    'javascript', 'typescript', 'node.js', 'react', 'next.js', 'vue', 'angular',
    'python', 'web development', 'frontend', 'backend', 'fullstack',
    'vibe coding', 'modern development', 'developer tools',

    // Инструменты
    'cursor', 'windsurf', 'github copilot', 'ai coding', 'ai programming',
    'bun', 'deno', 'vite', 'webpack',

    // Новые технологии
    'blockchain', 'web3', 'crypto', 'nft',
    'vr', 'ar', 'metaverse',

    // Тренды
    'startup', 'technology news', 'tech trends', 'innovation',
  ];

  constructor(runtime: IAgentRuntime) {
    super();
    this.parser = new Parser({
      customFields: {
        item: ['media:content', 'media:thumbnail', 'category'],
      },
    });
  }

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new NewsMonitorService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      logger.info('[NewsMonitor] ⏹️ Monitoring stopped');
    }
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[NewsMonitor] 📰 Initializing news monitoring...');

    // Создаем таблицу если её нет
    await this.createNewsTable(runtime);

    // Сразу проверяем новости
    await this.checkNews(runtime);

    // Настраиваем периодическую проверку
    this.monitorInterval = setInterval(async () => {
      logger.info('[NewsMonitor] ⏰ Scheduled news check...');
      await this.checkNews(runtime);
    }, this.CHECK_INTERVAL_MS);

    logger.info(`[NewsMonitor] ✅ Monitoring enabled (check every ${this.CHECK_INTERVAL_MS / 1000 / 60} minutes)`);
    logger.info(`[NewsMonitor] 📤 Target chat: ${this.ADMIN_CHAT_ID}`);
  }

  /**
   * Создать таблицу для новостей
   */
  private async createNewsTable(runtime: IAgentRuntime): Promise<void> {
    try {
      const db = runtime.getDatabaseAdapter();
      if (!db) {
        logger.error('[NewsMonitor] ❌ Database not available');
        return;
      }

      await db.execute(`
        CREATE TABLE IF NOT EXISTS news_monitor (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guid TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          link TEXT NOT NULL,
          description TEXT,
          source TEXT NOT NULL,
          published_at DATETIME NOT NULL,
          topics TEXT,
          sent_to_chat BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Создаем индекс для быстрого поиска
      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_news_guid
        ON news_monitor(guid)
      `);

      await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_news_sent
        ON news_monitor(sent_to_chat)
      `);

      logger.info('[NewsMonitor] ✅ Database table created');
    } catch (error) {
      logger.error('[NewsMonitor] ❌ Failed to create table:', error);
    }
  }

  /**
   * Проверить все источники новостей
   */
  private async checkNews(runtime: IAgentRuntime): Promise<void> {
    logger.info('[NewsMonitor] 🔍 Checking news sources...');

    let newNewsCount = 0;

    for (const source of this.NEWS_SOURCES) {
      try {
        if (!source.rss) continue;

        logger.info(`[NewsMonitor] 📡 Checking ${source.name}...`);

        const feed = await this.parser.parseURL(source.rss);
        const recentItems = feed.items.slice(0, 10); // Последние 10 постов

        for (const item of recentItems) {
          // Проверяем релевантность
          if (!this.isRelevantNews(item)) continue;

          // Проверяем, не отправляли ли уже
          const newsId = item.guid || item.link;
          if (!newsId) continue;

          const alreadySent = await this.isNewsAlreadySent(runtime, newsId);
          if (alreadySent) continue;

          // Сохраняем новость
          await this.saveNews(runtime, {
            guid: newsId,
            title: item.title || 'Без названия',
            link: item.link || '',
            description: item.contentSnippet || item.content || '',
            source: source.name,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            topics: source.keywords,
            sentToChat: false,
            createdAt: new Date(),
          });

          // Отправляем в Telegram
          await this.sendNewsToChat(runtime, {
            guid: newsId,
            title: item.title || 'Без названия',
            link: item.link || '',
            description: item.contentSnippet || item.content || '',
            source: source.name,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            topics: source.keywords,
            sentToChat: false,
            createdAt: new Date(),
          });

          newNewsCount++;

          // Пауза между новостями
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        logger.info(`[NewsMonitor] ✅ ${source.name} processed`);
      } catch (error) {
        logger.error(`[NewsMonitor] ❌ Failed to process ${source.name}:`, error);
      }
    }

    if (newNewsCount > 0) {
      logger.info(`[NewsMonitor] 🎉 Sent ${newNewsCount} new news items`);
    } else {
      logger.info('[NewsMonitor] ℹ️ No new relevant news found');
    }
  }

  /**
   * Проверить релевантность новости
   */
  private isRelevantNews(item: Parser.Item): boolean {
    const title = (item.title || '').toLowerCase();
    const content = (item.contentSnippet || item.content || '').toLowerCase();
    const text = `${title} ${content}`;

    // Проверяем ключевые слова
    return this.RELEVANT_KEYWORDS.some(keyword =>
      text.includes(keyword.toLowerCase())
    );
  }

  /**
   * Проверить, отправляли ли уже эту новость
   */
  private async isNewsAlreadySent(runtime: IAgentRuntime, guid: string): Promise<boolean> {
    try {
      const db = runtime.getDatabaseAdapter();
      if (!db) return false;

      const result = await db.query(
        'SELECT id FROM news_monitor WHERE guid = ?',
        [guid]
      );

      return result.length > 0;
    } catch (error) {
      logger.error('[NewsMonitor] ❌ Failed to check news:', error);
      return false;
    }
  }

  /**
   * Сохранить новость в БД
   */
  private async saveNews(runtime: IAgentRuntime, news: NewsItem): Promise<void> {
    try {
      const db = runtime.getDatabaseAdapter();
      if (!db) return;

      await db.execute(
        `INSERT OR IGNORE INTO news_monitor
         (guid, title, link, description, source, published_at, topics, sent_to_chat, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          news.guid,
          news.title,
          news.link,
          news.description,
          news.source,
          news.publishedAt.toISOString(),
          JSON.stringify(news.topics),
          news.sentToChat,
          news.createdAt.toISOString(),
        ]
      );

      logger.info(`[NewsMonitor] 💾 Saved: ${news.title}`);
    } catch (error) {
      logger.error('[NewsMonitor] ❌ Failed to save news:', error);
    }
  }

  /**
   * Отправить новость в Telegram
   */
  private async sendNewsToChat(runtime: IAgentRuntime, news: NewsItem): Promise<void> {
    try {
      const telegramService = runtime.getService('telegram');
      if (!telegramService || !telegramService.bot) {
        logger.error('[NewsMonitor] ❌ TelegramService not available');
        return;
      }

      // Форматируем новость
      const newsText = this.formatNewsForTelegram(news);

      // Кнопки
      const buttons = {
        inline_keyboard: [
          [
            { text: '🔗 Читать источник', url: news.link },
            { text: '📝 Создать пост', callback_data: `create_post:${news.guid}` },
          ],
          [
            { text: '👍 Полезно', callback_data: `useful:${news.guid}` },
            { text: '👎 Неинтересно', callback_data: `not_useful:${news.guid}` },
          ],
        ],
      };

      // Отправляем
      await telegramService.bot.telegram.sendMessage(
        this.ADMIN_CHAT_ID,
        newsText,
        {
          parse_mode: 'Markdown',
          reply_markup: buttons,
        }
      );

      // Отмечаем как отправленную
      await this.markAsSent(runtime, news.guid);

      logger.info(`[NewsMonitor] 📤 Sent: ${news.title}`);
    } catch (error) {
      logger.error('[NewsMonitor] ❌ Failed to send news:', error);
    }
  }

  /**
   * Отформатировать новость для Telegram
   */
  private formatNewsForTelegram(news: NewsItem): string {
    const source = news.source;
    const title = news.title;
    const description = news.description.substring(0, 200) + '...';
    const topics = news.topics.slice(0, 3).map(t => `#${t.replace(/\s+/g, '_')}`).join(' ');

    return `📰 **${title}**

${description}

🔗 Источник: ${source}
📅 ${news.publishedAt.toLocaleDateString('ru-RU')}

${topics}

От Vibee News Monitor 🤖`;
  }

  /**
   * Отметить новость как отправленную
   */
  private async markAsSent(runtime: IAgentRuntime, guid: string): Promise<void> {
    try {
      const db = runtime.getDatabaseAdapter();
      if (!db) return;

      await db.execute(
        'UPDATE news_monitor SET sent_to_chat = TRUE WHERE guid = ?',
        [guid]
      );
    } catch (error) {
      logger.error('[NewsMonitor] ❌ Failed to mark as sent:', error);
    }
  }
}

// ========================================
// ПЛАГИН
// ========================================

export const newsMonitorPlugin: Plugin = {
  name: 'news-monitor',
  description: 'Умный мониторинг новостей по vibe-coding',
  services: [NewsMonitorService],
};

export default newsMonitorPlugin;
