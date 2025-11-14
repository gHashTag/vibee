/**
 * Object Pool for Memory Optimization
 * Пулы объектов для переиспользования памяти и снижения GC
 */

export interface Poolable {
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private initialSize: number;
  private maxSize: number;
  private acquiredCount = 0;
  private releasedCount = 0;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize = 10,
    maxSize = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.initialSize = initialSize;
    this.maxSize = maxSize;

    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /**
   * Получает объект из пула
   */
  acquire(): T {
    const obj = this.pool.pop() || this.factory();
    this.acquiredCount++;
    return obj;
  }

  /**
   * Возвращает объект в пул
   */
  release(obj: T): void {
    // Reset the object before returning to pool
    try {
      this.reset(obj);
    } catch (error) {
      console.error('[ObjectPool] Error resetting object:', error);
      return; // Don't pool objects that can't be reset
    }

    // Only add back if we haven't exceeded max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
      this.releasedCount++;
    }
  }

  /**
   * Получает несколько объектов сразу
   */
  acquireMany(count: number): T[] {
    const objects: T[] = [];
    for (let i = 0; i < count; i++) {
      objects.push(this.acquire());
    }
    return objects;
  }

  /**
   * Возвращает несколько объектов сразу
   */
  releaseMany(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj);
    }
  }

  /**
   * Очищает пул полностью
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * Предзаполняет пул новыми объектами
   */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * Получает статистику пула
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      acquired: this.acquiredCount,
      released: this.releasedCount,
      initialSize: this.initialSize,
      maxSize: this.maxSize,
      utilization: this.acquiredCount > 0
        ? ((this.acquiredCount - this.releasedCount) / this.acquiredCount * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Проверяет здоровье пула
   */
  healthCheck() {
    const stats = this.getStats();
    const issues: string[] = [];

    if (stats.poolSize === 0) {
      issues.push('Pool is empty - may need pre-warming');
    }

    if (stats.utilization === '100%') {
      issues.push('All acquired objects not released - possible memory leak');
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats,
    };
  }
}

/**
 * Auto-release wrapper для объектов из пула
 * Использует try-finally для автоматического возврата в пул
 */
export class PooledObject<T extends Poolable> {
  private pool: ObjectPool<T>;
  private obj: T;

  constructor(pool: ObjectPool<T>) {
    this.pool = pool;
    this.obj = pool.acquire();
  }

  get value(): T {
    return this.obj;
  }

  release(): void {
    this.pool.release(this.obj);
  }
}

/**
 * Factory для создания пулов
 */
export class ObjectPoolFactory {
  private pools = new Map<string, ObjectPool<Poolable>>();

  createPool<T extends Poolable>(
    name: string,
    factory: () => T,
    reset: (obj: T) => void,
    initialSize = 10,
    maxSize = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(factory, reset, initialSize, maxSize);
    this.pools.set(name, pool as ObjectPool<Poolable>);
    return pool;
  }

  getPool<T extends Poolable>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T> | undefined;
  }

  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, pool] of this.pairs()) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  getAllHealthChecks(): Record<string, any> {
    const health: Record<string, any> = {};
    for (const [name, pool] of this.pairs()) {
      health[name] = pool.healthCheck();
    }
    return health;
  }

  private* pairs(): IterableIterator<[string, ObjectPool<Poolable>]> {
    for (const [name, pool] of this.pools) {
      yield [name, pool];
    }
  }
}

// Экспортируем singleton factory
export const objectPoolFactory = new ObjectPoolFactory();

// Предопределённые пулы для частых объектов

// Пулы для AI Photoshop
export const createAIPhotoshopPools = () => {
  const requestPool = objectPoolFactory.createPool(
    'ai-photoshop-request',
    () => ({
      prompt: '',
      imageUrl: '',
      model: 'seedream' as any,
      aspectRatio: '9:16',
      quality: '1K',
      cameraAngle: undefined,
      lighting: undefined,
      composition: undefined,
      seed: undefined,
      guidanceScale: undefined,
      variationsCount: 1,
      reset() {
        this.prompt = '';
        this.imageUrl = '';
        this.cameraAngle = undefined;
        this.lighting = undefined;
        this.composition = undefined;
        this.seed = undefined;
        this.guidanceScale = undefined;
        this.variationsCount = 1;
      },
    }),
    (obj) => obj.reset(),
    50,
    200
  );

  const resultPool = objectPoolFactory.createPool(
    'ai-photoshop-result',
    () => ({
      success: false,
      imageUrl: '',
      model: 'seedream' as any,
      error: '',
      processingTime: 0,
      cost: 0,
      reset() {
        this.success = false;
        this.imageUrl = '';
        this.error = '';
        this.processingTime = 0;
        this.cost = 0;
      },
    }),
    (obj) => obj.reset(),
    50,
    200
  );

  return { requestPool, resultPool };
};

export const createTelegramPools = () => {
  const messagePool = objectPoolFactory.createPool(
    'telegram-message',
    () => ({
      chatId: '',
      text: '',
      parseMode: 'HTML',
      replyMarkup: undefined,
      reset() {
        this.chatId = '';
        this.text = '';
        this.replyMarkup = undefined;
      },
    }),
    (obj) => obj.reset(),
    100,
    500
  );

  return { messagePool };
};

export const createTrainingPools = () => {
  const sessionPool = objectPoolFactory.createPool(
    'training-session',
    () => ({
      userId: '',
      modelName: '',
      triggerWord: '',
      images: [],
      status: 'pending',
      createdAt: 0,
      reset() {
        this.userId = '';
        this.modelName = '';
        this.triggerWord = '';
        this.images = [];
        this.status = 'pending';
        this.createdAt = 0;
      },
    }),
    (obj) => obj.reset(),
    20,
    100
  );

  return { sessionPool };
};
