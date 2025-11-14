/**
 * Analytics Plugin - Автономная система сбора и анализа метрик
 *
 * Собирает данные о каждом созданном Reels для автоматического обучения системы
 */

import { Service, Plugin, type IAgentRuntime, logger } from '@elizaos/core';

interface ReelsMetrics {
  id?: string;
  videoUrl: string;
  newsSource: string;
  createdAt: Date;
  publishedAt?: Date;

  // Контент метрики
  hookVariant?: string;
  voiceType?: string;
  visualStyle?: string;
  hashtags?: string[];
  contentLength?: number; // секунды

  // Engagement метрики (обновляются автоматически)
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  avgWatchTime?: number;

  // Вычисляемые метрики
  engagementRate?: number;
  viralityScore?: number;
  qualityScore?: number;
}

interface SuccessPattern {
  patternType: string; // 'hook', 'voice', 'style', etc.
  patternValue: string;
  avgEngagement: number;
  sampleSize: number;
  confidenceLevel: number;
}

/**
 * Analytics Service - собирает и анализирует метрики
 */
class AnalyticsService extends Service {
  static serviceType = 'analytics';

  // In-memory хранилище (позже можно заменить на БД)
  private metrics: Map<string, ReelsMetrics> = new Map();
  private patterns: Map<string, SuccessPattern[]> = new Map();

  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_INTERVAL_MS = 1000 * 60 * 60; // Каждый час обновлять метрики

  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new AnalyticsService();
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.info('[Analytics] Stopped');
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[Analytics] 📊 Initializing analytics system...');

    // Загружаем исторические данные из БД (если есть)
    await this.loadHistoricalData(runtime);

    // Настраиваем автоматическое обновление метрик
    this.updateInterval = setInterval(async () => {
      await this.updateAllMetrics(runtime);
      await this.analyzePatterns(runtime);
      await this.generateInsights(runtime);
    }, this.UPDATE_INTERVAL_MS);

    logger.info('[Analytics] ✅ Analytics system ready');
  }

  /**
   * Сохранить метрики нового Reels
   */
  async trackReels(metrics: ReelsMetrics): Promise<void> {
    const id = metrics.videoUrl; // Используем URL как ID
    this.metrics.set(id, {
      ...metrics,
      createdAt: new Date(),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
    });

    logger.info(`[Analytics] 📈 Tracking new Reels: ${id}`);

    // TODO: Сохранить в БД
  }

  /**
   * Обновить метрики существующего Reels
   */
  async updateMetrics(videoUrl: string, updates: Partial<ReelsMetrics>): Promise<void> {
    const existing = this.metrics.get(videoUrl);
    if (existing) {
      Object.assign(existing, updates);

      // Вычисляем engagement rate
      if (existing.views && existing.views > 0) {
        const totalEngagement = (existing.likes || 0) + (existing.comments || 0) + (existing.shares || 0);
        existing.engagementRate = (totalEngagement / existing.views) * 100;
      }

      // Вычисляем virality score
      existing.viralityScore = this.calculateViralityScore(existing);

      // Вычисляем quality score
      existing.qualityScore = this.calculateQualityScore(existing);

      logger.info(`[Analytics] 🔄 Updated metrics for ${videoUrl}: ER=${existing.engagementRate?.toFixed(2)}%`);
    }
  }

  /**
   * Получить метрики Reels
   */
  getMetrics(videoUrl: string): ReelsMetrics | undefined {
    return this.metrics.get(videoUrl);
  }

  /**
   * Получить топ-N лучших Reels
   */
  getTopPerformers(n: number = 10): ReelsMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => (b.viralityScore || 0) - (a.viralityScore || 0))
      .slice(0, n);
  }

  /**
   * Получить успешные паттерны
   */
  getSuccessfulPatterns(type: string): SuccessPattern[] {
    return this.patterns.get(type) || [];
  }

  /**
   * Вычислить virality score (0-100)
   */
  private calculateViralityScore(metrics: ReelsMetrics): number {
    let score = 0;

    // Базовые просмотры (max 30 баллов)
    if (metrics.views) {
      score += Math.min((metrics.views / 10000) * 30, 30);
    }

    // Engagement rate (max 40 баллов)
    if (metrics.engagementRate) {
      score += Math.min(metrics.engagementRate * 4, 40);
    }

    // Shares (max 20 баллов)
    if (metrics.shares && metrics.views) {
      const shareRate = (metrics.shares / metrics.views) * 100;
      score += Math.min(shareRate * 10, 20);
    }

    // Watch time (max 10 баллов)
    if (metrics.avgWatchTime && metrics.contentLength) {
      const completionRate = metrics.avgWatchTime / metrics.contentLength;
      score += completionRate * 10;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Вычислить quality score (0-100)
   */
  private calculateQualityScore(metrics: ReelsMetrics): number {
    let score = 0;

    // Engagement rate (40 баллов)
    if (metrics.engagementRate) {
      score += Math.min(metrics.engagementRate * 4, 40);
    }

    // Completion rate (30 баллов)
    if (metrics.avgWatchTime && metrics.contentLength) {
      const completionRate = metrics.avgWatchTime / metrics.contentLength;
      score += completionRate * 30;
    }

    // Comment/Like ratio (20 баллов) - показывает заинтересованность
    if (metrics.comments && metrics.likes && metrics.likes > 0) {
      const ratio = Math.min(metrics.comments / metrics.likes, 0.2); // 20% - идеально
      score += (ratio / 0.2) * 20;
    }

    // Saves (10 баллов) - показывает ценность контента
    if (metrics.saves && metrics.views && metrics.views > 0) {
      const saveRate = (metrics.saves / metrics.views) * 100;
      score += Math.min(saveRate * 2, 10);
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Обновить все метрики (получить свежие данные из Instagram/TikTok)
   */
  private async updateAllMetrics(runtime: IAgentRuntime): Promise<void> {
    logger.info('[Analytics] 🔄 Updating all metrics from social platforms...');

    // TODO: Интеграция с Instagram Graph API
    // TODO: Интеграция с TikTok API

    logger.info('[Analytics] ✅ Metrics updated');
  }

  /**
   * Анализировать паттерны успеха
   */
  private async analyzePatterns(runtime: IAgentRuntime): Promise<void> {
    logger.info('[Analytics] 🔍 Analyzing success patterns...');

    // Анализируем хуки
    await this.analyzeHookPatterns();

    // Анализируем голоса
    await this.analyzeVoicePatterns();

    // Анализируем визуальные стили
    await this.analyzeVisualPatterns();

    // Анализируем хэштеги
    await this.analyzeHashtagPatterns();

    logger.info('[Analytics] ✅ Pattern analysis complete');
  }

  /**
   * Анализировать эффективность хуков
   */
  private async analyzeHookPatterns(): Promise<void> {
    const hookStats = new Map<string, { total: number; avgEngagement: number; samples: number }>();

    for (const metrics of this.metrics.values()) {
      if (metrics.hookVariant && metrics.engagementRate) {
        const stats = hookStats.get(metrics.hookVariant) || { total: 0, avgEngagement: 0, samples: 0 };
        stats.total += metrics.engagementRate;
        stats.samples += 1;
        stats.avgEngagement = stats.total / stats.samples;
        hookStats.set(metrics.hookVariant, stats);
      }
    }

    // Сохраняем успешные паттерны
    const patterns: SuccessPattern[] = [];
    for (const [hook, stats] of hookStats.entries()) {
      if (stats.samples >= 5) {
        // Минимум 5 образцов для статистической значимости
        patterns.push({
          patternType: 'hook',
          patternValue: hook,
          avgEngagement: stats.avgEngagement,
          sampleSize: stats.samples,
          confidenceLevel: this.calculateConfidence(stats.samples),
        });
      }
    }

    this.patterns.set('hook', patterns.sort((a, b) => b.avgEngagement - a.avgEngagement));
  }

  /**
   * Анализировать эффективность голосов
   */
  private async analyzeVoicePatterns(): Promise<void> {
    const voiceStats = new Map<string, { total: number; avgEngagement: number; samples: number }>();

    for (const metrics of this.metrics.values()) {
      if (metrics.voiceType && metrics.engagementRate) {
        const stats = voiceStats.get(metrics.voiceType) || { total: 0, avgEngagement: 0, samples: 0 };
        stats.total += metrics.engagementRate;
        stats.samples += 1;
        stats.avgEngagement = stats.total / stats.samples;
        voiceStats.set(metrics.voiceType, stats);
      }
    }

    const patterns: SuccessPattern[] = [];
    for (const [voice, stats] of voiceStats.entries()) {
      if (stats.samples >= 3) {
        patterns.push({
          patternType: 'voice',
          patternValue: voice,
          avgEngagement: stats.avgEngagement,
          sampleSize: stats.samples,
          confidenceLevel: this.calculateConfidence(stats.samples),
        });
      }
    }

    this.patterns.set('voice', patterns.sort((a, b) => b.avgEngagement - a.avgEngagement));
  }

  /**
   * Анализировать эффективность визуальных стилей
   */
  private async analyzeVisualPatterns(): Promise<void> {
    const styleStats = new Map<string, { total: number; avgEngagement: number; samples: number }>();

    for (const metrics of this.metrics.values()) {
      if (metrics.visualStyle && metrics.engagementRate) {
        const stats = styleStats.get(metrics.visualStyle) || { total: 0, avgEngagement: 0, samples: 0 };
        stats.total += metrics.engagementRate;
        stats.samples += 1;
        stats.avgEngagement = stats.total / stats.samples;
        styleStats.set(metrics.visualStyle, stats);
      }
    }

    const patterns: SuccessPattern[] = [];
    for (const [style, stats] of styleStats.entries()) {
      if (stats.samples >= 3) {
        patterns.push({
          patternType: 'style',
          patternValue: style,
          avgEngagement: stats.avgEngagement,
          sampleSize: stats.samples,
          confidenceLevel: this.calculateConfidence(stats.samples),
        });
      }
    }

    this.patterns.set('style', patterns.sort((a, b) => b.avgEngagement - a.avgEngagement));
  }

  /**
   * Анализировать эффективность хэштегов
   */
  private async analyzeHashtagPatterns(): Promise<void> {
    const hashtagStats = new Map<string, { total: number; avgEngagement: number; samples: number }>();

    for (const metrics of this.metrics.values()) {
      if (metrics.hashtags && metrics.engagementRate) {
        for (const tag of metrics.hashtags) {
          const stats = hashtagStats.get(tag) || { total: 0, avgEngagement: 0, samples: 0 };
          stats.total += metrics.engagementRate;
          stats.samples += 1;
          stats.avgEngagement = stats.total / stats.samples;
          hashtagStats.set(tag, stats);
        }
      }
    }

    const patterns: SuccessPattern[] = [];
    for (const [tag, stats] of hashtagStats.entries()) {
      if (stats.samples >= 5) {
        patterns.push({
          patternType: 'hashtag',
          patternValue: tag,
          avgEngagement: stats.avgEngagement,
          sampleSize: stats.samples,
          confidenceLevel: this.calculateConfidence(stats.samples),
        });
      }
    }

    this.patterns.set('hashtag', patterns.sort((a, b) => b.avgEngagement - a.avgEngagement));
  }

  /**
   * Вычислить уровень уверенности (0-1) на основе размера выборки
   */
  private calculateConfidence(sampleSize: number): number {
    // Чем больше выборка, тем выше уверенность
    // 30+ образцов = 95% уверенность
    return Math.min(sampleSize / 30, 1);
  }

  /**
   * Генерировать инсайты для админа
   */
  private async generateInsights(runtime: IAgentRuntime): Promise<void> {
    const topPerformers = this.getTopPerformers(5);

    if (topPerformers.length === 0) {
      logger.info('[Analytics] 📊 Not enough data for insights yet');
      return;
    }

    logger.info('[Analytics] 💡 Generating insights...');

    // Лучшие паттерны
    const bestHooks = this.patterns.get('hook')?.slice(0, 3) || [];
    const bestVoices = this.patterns.get('voice')?.slice(0, 2) || [];
    const bestHashtags = this.patterns.get('hashtag')?.slice(0, 5) || [];

    const insights = `
📊 Analytics Insights Report

🏆 Top Performers:
${topPerformers.map((m, i) => `${i + 1}. ${m.newsSource} - ER: ${m.engagementRate?.toFixed(2)}%, VS: ${m.viralityScore}`).join('\n')}

🔥 Best Hooks:
${bestHooks.map((p) => `- "${p.patternValue}" (${p.avgEngagement.toFixed(2)}% ER, ${p.sampleSize} samples)`).join('\n')}

🎙️ Best Voices:
${bestVoices.map((p) => `- ${p.patternValue} (${p.avgEngagement.toFixed(2)}% ER, ${p.sampleSize} samples)`).join('\n')}

#️⃣ Best Hashtags:
${bestHashtags.map((p) => `- ${p.patternValue} (${p.avgEngagement.toFixed(2)}% ER, ${p.sampleSize} samples)`).join('\n')}

📈 Recommendations:
${this.generateRecommendations(bestHooks, bestVoices, bestHashtags).join('\n')}
`;

    logger.info(insights);

    // TODO: Отправить отчет админу в Telegram
  }

  /**
   * Генерировать рекомендации на основе паттернов
   */
  private generateRecommendations(
    hooks: SuccessPattern[],
    voices: SuccessPattern[],
    hashtags: SuccessPattern[]
  ): string[] {
    const recommendations: string[] = [];

    if (hooks.length > 0 && hooks[0].confidenceLevel > 0.8) {
      recommendations.push(`✅ Use hook style: "${hooks[0].patternValue}" (proven ${hooks[0].confidenceLevel * 100}% confidence)`);
    }

    if (voices.length > 0 && voices[0].confidenceLevel > 0.6) {
      recommendations.push(`✅ Prefer voice: ${voices[0].patternValue} (${voices[0].avgEngagement.toFixed(2)}% avg ER)`);
    }

    if (hashtags.length >= 3) {
      recommendations.push(
        `✅ Use hashtags: ${hashtags
          .slice(0, 3)
          .map((h) => h.patternValue)
          .join(', ')}`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('📊 Keep collecting data for better recommendations');
    }

    return recommendations;
  }

  /**
   * Загрузить исторические данные
   */
  private async loadHistoricalData(runtime: IAgentRuntime): Promise<void> {
    // TODO: Загрузить из БД
    logger.info('[Analytics] 📂 Loading historical data...');
  }
}

export const analyticsPlugin: Plugin = {
  name: 'analytics',
  description: 'Autonomous analytics and learning system for content optimization',
  services: [AnalyticsService],
};

export default analyticsPlugin;
