/**
 * Тест Vector Database Plugin
 */

import { describe, test, expect } from 'bun:test';
import { VectorDatabaseService } from '../src/academy/vector-db-plugin';

describe('Vector Database Plugin', () => {
  let service: VectorDatabaseService;

  test('Create Vector Database Service', () => {
    service = new VectorDatabaseService();
    expect(service).toBeDefined();
    expect(VectorDatabaseService.serviceType).toBe('vector-database');
  });

  test('Generate fallback embedding', () => {
    const embedding = service['generateFallbackEmbedding']('Test text for embedding');

    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(1536);
    expect(embedding.every(v => typeof v === 'number')).toBe(true);
  });

  test('Generate similar embeddings for similar text', () => {
    const text1 = 'This is a test document about AI agents';
    const text2 = 'This document tests AI agents with machine learning';

    const emb1 = service['generateFallbackEmbedding'](text1);
    const emb2 = service['generateFallbackEmbedding'](text2);

    const similarity = service['cosineSimilarity'](emb1, emb2);

    // Similar texts should have higher similarity
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  test('Cosine similarity calculation', () => {
    const vector1 = [1, 0, 0];
    const vector2 = [1, 0, 0];
    const vector3 = [0, 1, 0];

    const sim1 = service['cosineSimilarity'](vector1, vector2);
    const sim2 = service['cosineSimilarity'](vector1, vector3);

    expect(sim1).toBe(1); // Identical vectors
    expect(sim2).toBe(0); // Orthogonal vectors
  });

  test('Search functionality with mock data', async () => {
    // Test that search method works without errors
    const text1 = 'AI agents are intelligent software systems';
    const text2 = 'Machine learning is a subset of AI';

    service['embeddings'] = [
      {
        id: 'test-1',
        courseId: 'test-course',
        lessonPath: 'lesson-1',
        content: text1,
        embedding: service['generateFallbackEmbedding'](text1),
        metadata: { title: 'AI Agents', course: 'Test', section: 'Basics' }
      },
      {
        id: 'test-2',
        courseId: 'test-course',
        lessonPath: 'lesson-2',
        content: text2,
        embedding: service['generateFallbackEmbedding'](text2),
        metadata: { title: 'ML Basics', course: 'Test', section: 'Advanced' }
      }
    ];

    service['isInitialized'] = true;

    const results = await service.search('AI agents software systems', 2);

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  test('Get stats', () => {
    service['embeddings'] = [
      {
        id: '1',
        courseId: 'course-1',
        lessonPath: 'lesson-1',
        content: 'Test content 1',
        embedding: [],
        metadata: { title: 'Test 1', course: 'Course 1', section: 'Section 1' }
      },
      {
        id: '2',
        courseId: 'course-1',
        lessonPath: 'lesson-2',
        content: 'Test content 2',
        embedding: [],
        metadata: { title: 'Test 2', course: 'Course 1', section: 'Section 2' }
      },
      {
        id: '3',
        courseId: 'course-2',
        lessonPath: 'lesson-3',
        content: 'Test content 3',
        embedding: [],
        metadata: { title: 'Test 3', course: 'Course 2', section: 'Section 3' }
      }
    ];

    const stats = service.getStats();

    expect(stats.totalChunks).toBe(3);
    expect(stats.courses).toContain('course-1');
    expect(stats.courses).toContain('course-2');
    expect(stats.courses.length).toBe(2);
  });

  test('Get course embeddings', () => {
    service['embeddings'] = [
      {
        id: '1',
        courseId: 'course-1',
        lessonPath: 'lesson-1',
        content: 'Content 1',
        embedding: [],
        metadata: { title: 'Test 1', course: 'Course 1', section: 'Section 1' }
      },
      {
        id: '2',
        courseId: 'course-2',
        lessonPath: 'lesson-2',
        content: 'Content 2',
        embedding: [],
        metadata: { title: 'Test 2', course: 'Course 2', section: 'Section 2' }
      }
    ];

    const course1Embeddings = service.getCourseEmbeddings('course-1');

    expect(course1Embeddings.length).toBe(1);
    expect(course1Embeddings[0].courseId).toBe('course-1');
  });
});
