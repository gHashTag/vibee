/**
 * Vector Database Plugin
 * Векторизация документации академии для семантического поиска
 */

import { logger, type IAgentRuntime, type Plugin, Service } from '@elizaos/core';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

logger.info('🧠 [VECTOR DB PLUGIN] Module loaded - exporting plugin');

interface EmbeddingData {
  id: string;
  courseId: string;
  lessonPath: string;
  content: string;
  embedding: number[];
  metadata: {
    title: string;
    course: string;
    section: string;
  };
}

class VectorDatabaseService extends Service {
  static serviceType = 'vector-database';
  public capabilityDescription = 'Vector database for semantic search across academy courses';

  private embeddings: EmbeddingData[] = [];
  private isInitialized = false;

  async initialize(runtime: IAgentRuntime): Promise<void> {
    logger.info('[VectorDatabaseService] 🔍 Initializing vector database...');

    try {
      // Загружаем курсы из academy/courses
      await this.loadCourses();
      this.isInitialized = true;

      logger.info(`[VectorDatabaseService] ✅ Loaded ${this.embeddings.length} embeddings`);
    } catch (error) {
      logger.error('[VectorDatabaseService] ❌ Error initializing:', error);
    }
  }

  /**
   * Загрузка всех курсов и их векторизация
   */
  private async loadCourses(): Promise<void> {
    const coursesPath = path.join(process.cwd(), 'academy', 'courses');

    try {
      // Получаем список курсов
      const courseDirs = await readdir(coursesPath, { withFileTypes: true });

      for (const dirent of courseDirs) {
        if (dirent.isDirectory()) {
          const courseName = dirent.name;
          logger.info(`[VectorDatabaseService] Processing course: ${courseName}`);

          await this.processCourse(courseName);
        }
      }

      logger.info(`[VectorDatabaseService] ✅ Vectorization complete: ${this.embeddings.length} chunks`);
    } catch (error) {
      logger.error('[VectorDatabaseService] ❌ Error loading courses:', error);
    }
  }

  /**
   * Обработка одного курса
   */
  private async processCourse(courseName: string): Promise<void> {
    const coursePath = path.join(process.cwd(), 'academy', 'courses', courseName);

    // Рекурсивно обходим все файлы
    await this.processDirectory(coursePath, courseName, '');
  }

  /**
   * Рекурсивная обработка директории
   */
  private async processDirectory(
    dirPath: string,
    courseName: string,
    relativePath: string
  ): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);

        // Пропускаем служебные файлы
        if (entry.name.startsWith('.') || entry.name === 'docs' || entry.name === 'scripts') {
          continue;
        }

        if (entry.isDirectory()) {
          await this.processDirectory(fullPath, courseName, relPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          await this.processMarkdownFile(fullPath, courseName, relPath);
        }
      }
    } catch (error) {
      logger.error(`[VectorDatabaseService] ❌ Error processing directory ${dirPath}:`, error);
    }
  }

  /**
   * Обработка markdown файла
   */
  private async processMarkdownFile(
    filePath: string,
    courseName: string,
    relativePath: string
  ): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');

      // Разбиваем на чанки по заголовкам или по размеру
      const chunks = this.chunkMarkdown(content, relativePath, courseName);

      for (const chunk of chunks) {
        // Генерируем embedding для каждого чанка
        const embedding = await this.generateEmbedding(chunk.content);

        this.embeddings.push({
          id: `${courseName}-${relativePath}-${chunk.index}`,
          courseId: courseName,
          lessonPath: relativePath,
          content: chunk.content,
          embedding,
          metadata: {
            title: chunk.title,
            course: courseName,
            section: chunk.section,
          },
        });
      }
    } catch (error) {
      logger.error(`[VectorDatabaseService] ❌ Error processing file ${filePath}:`, error);
    }
  }

  /**
   * Разбиение markdown на чанки
   */
  private chunkMarkdown(
    content: string,
    filePath: string,
    courseName: string
  ): Array<{ content: string; title: string; section: string; index: number }> {
    const chunks: Array<{ content: string; title: string; section: string; index: number }> = [];

    // Удаляем markdown форматирование для лучшей векторизации
    const cleanContent = content
      .replace(/```[\s\S]*?```/g, ' ') // Удаляем блоки кода
      .replace(/`[^`]*`/g, ' ') // Удаляем inline код
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Удаляем ссылки, оставляем текст
      .replace(/[#>*_~`-]/g, ' ') // Удаляем markdown символы
      .replace(/\n\s*\n/g, '\n') // Удаляем лишние переносы
      .trim();

    // Разбиваем по заголовкам
    const sections = cleanContent.split(/\n(?=#+\s)/);

    let index = 0;
    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.split('\n');
      const titleLine = lines[0];
      const title = titleLine.replace(/^#+\s*/, '').trim();

      chunks.push({
        content: section.trim(),
        title: title || filePath,
        section: courseName,
        index: index++,
      });
    }

    return chunks;
  }

  /**
   * Генерация embedding вектора
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

      if (!openaiApiKey) {
        logger.warn('[VectorDatabaseService] ⚠️ No OpenAI key found, using fallback embedding');
        // Fallback to simple hash-based embedding if no API key
        return this.generateFallbackEmbedding(text);
      }

      // Truncate text to avoid token limits (max ~8000 tokens for embeddings)
      const maxLength = 8000;
      const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;

      const apiUrl = process.env.OPENAI_API_KEY
        ? 'https://api.openai.com/v1/embeddings'
        : 'https://openrouter.ai/api/v1/embeddings';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
          ...(process.env.OPENROUTER_API_KEY && {
            'HTTP-Referer': 'https://vibee.academy',
            'X-Title': 'Vibee Academy'
          })
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small', // Fast and cost-effective
          input: truncatedText
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('[VectorDatabaseService] ❌ OpenAI API error:', errorText);
        return this.generateFallbackEmbedding(text);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      logger.info(`[VectorDatabaseService] ✅ Generated embedding for ${text.length} chars`);
      return embedding;
    } catch (error) {
      logger.error('[VectorDatabaseService] ❌ Error generating embedding:', error);
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Fallback embedding based on text hash (for offline use)
   */
  private generateFallbackEmbedding(text: string): number[] {
    const embedding = new Array(1536).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    // Simple hash-based embedding
    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash |= 0;
      }

      // Distribute hash across embedding dimensions
      for (let i = 0; i < 64; i++) {
        const index = Math.abs(hash + i * 12345) % 1536;
        embedding[index] += (Math.sin(hash) + 1) / 2;
      }
    }

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)) || 1;
    return embedding.map(val => val / norm);
  }

  /**
   * Поиск похожего контента
   */
  async search(query: string, limit: number = 5): Promise<EmbeddingData[]> {
    if (!this.isInitialized) {
      logger.warn('[VectorDatabaseService] ⚠️ Vector database not initialized');
      return [];
    }

    try {
      // Генерируем embedding для запроса
      const queryEmbedding = await this.generateEmbedding(query);

      // Простой поиск по косинусному сходству
      const results = this.embeddings
        .map(item => ({
          item,
          similarity: this.cosineSimilarity(queryEmbedding, item.embedding),
        }))
        .filter(r => r.similarity > 0.1) // Порог схожести
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(r => r.item);

      return results;
    } catch (error) {
      logger.error('[VectorDatabaseService] ❌ Error searching:', error);
      return [];
    }
  }

  /**
   * Вычисление косинусного сходства
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Получение статистики
   */
  getStats(): { totalChunks: number; courses: string[] } {
    const courses = new Set(this.embeddings.map(e => e.courseId));
    return {
      totalChunks: this.embeddings.length,
      courses: Array.from(courses),
    };
  }

  /**
   * Получение всех эмбеддингов курса
   */
  getCourseEmbeddings(courseName: string): EmbeddingData[] {
    return this.embeddings.filter(e => e.courseId === courseName);
  }

  static async start(runtime: IAgentRuntime): Promise<VectorDatabaseService> {
    const service = new VectorDatabaseService(runtime);
    await service.initialize(runtime);
    return service;
  }

  async stop(): Promise<void> {
    logger.info('[VectorDatabaseService] Stopping...');
    this.embeddings = [];
  }
}

export { VectorDatabaseService };
export const vectorDbPlugin: Plugin = {
  name: 'vector-database',
  description: 'Vector database for academy courses with semantic search',
  services: [VectorDatabaseService],
};

logger.info('🧠 [VECTOR DB PLUGIN] Plugin exported');

export default vectorDbPlugin;
