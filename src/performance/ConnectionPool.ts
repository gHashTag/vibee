/**
 * Connection Pool for External APIs
 * Пулы соединений для внешних API (Replicate, OpenAI, etc.)
 */

export interface ConnectionPoolOptions {
  maxConnections?: number;
  minConnections?: number;
  acquireTimeoutMs?: number;
  idleTimeoutMs?: number;
  reapIntervalMs?: number;
}

export interface PooledConnection {
  id: string;
  createdAt: number;
  lastUsed: number;
  inUse: boolean;
  close(): Promise<void> | void;
}

export class ConnectionPool<T extends PooledConnection> {
  private connections: T[] = [];
  private waitingQueue: Array<{
    resolve: (connection: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private options: Required<ConnectionPoolOptions>;
  private factory: () => Promise<T>;
  private reapTimer: NodeJS.Timeout | null = null;

  constructor(
    factory: () => Promise<T>,
    options: ConnectionPoolOptions = {}
  ) {
    this.factory = factory;
    this.options = {
      maxConnections: options.maxConnections ?? 10,
      minConnections: options.minConnections ?? 2,
      acquireTimeoutMs: options.acquireTimeoutMs ?? 30000,
      idleTimeoutMs: options.idleTimeoutMs ?? 300000, // 5 minutes
      reapIntervalMs: options.reapIntervalMs ?? 60000, // 1 minute
    };

    // Pre-create minimum connections
    this.initialize();
  }

  /**
   * Initialize the pool with minimum connections
   */
  private async initialize(): Promise<void> {
    for (let i = 0; i < this.options.minConnections; i++) {
      try {
        const connection = await this.factory();
        this.connections.push(connection);
      } catch (error) {
        console.error('[ConnectionPool] Failed to create initial connection:', error);
      }
    }

    // Start connection reaping
    this.startReaper();
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<T> {
    // Try to get an existing idle connection
    const idleConnection = this.connections.find(conn => !conn.inUse);
    if (idleConnection) {
      idleConnection.inUse = true;
      idleConnection.lastUsed = Date.now();
      return idleConnection;
    }

    // Create new connection if under max limit
    if (this.connections.length < this.options.maxConnections) {
      try {
        const connection = await this.factory();
        connection.inUse = true;
        connection.lastUsed = Date.now();
        this.connections.push(connection);
        return connection;
      } catch (error) {
        throw new Error(`Failed to create connection: ${error}`);
      }
    }

    // Wait for a connection to become available
    return this.waitForConnection();
  }

  /**
   * Wait for a connection to become available
   */
  private waitForConnection(): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from waiting queue
        const index = this.waitingQueue.findIndex(w => w.timeout === timeout);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, this.options.acquireTimeoutMs);

      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection: T): Promise<void> {
    connection.inUse = false;
    connection.lastUsed = Date.now();

    // If there are waiting connections, give this one to the first in queue
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift()!;
      clearTimeout(waiting.timeout);
      connection.inUse = true;
      connection.lastUsed = Date.now();
      waiting.resolve(connection);
    }
  }

  /**
   * Remove a connection permanently
   */
  async remove(connection: T): Promise<void> {
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      await connection.close();
      this.connections.splice(index, 1);
    }
  }

  /**
   * Start the connection reaper
   */
  private startReaper(): void {
    this.reapTimer = setInterval(() => {
      this.reapIdleConnections();
    }, this.options.reapIntervalMs);
  }

  /**
   * Reap idle connections
   */
  private reapIdleConnections(): void {
    const now = Date.now();
    const connectionsToReap: T[] = [];

    for (const connection of this.connections) {
      if (
        !connection.inUse &&
        now - connection.lastUsed > this.options.idleTimeoutMs &&
        this.connections.length > this.options.minConnections
      ) {
        connectionsToReap.push(connection);
      }
    }

    // Remove connections
    for (const connection of connectionsToReap) {
      this.remove(connection);
    }

    // Create new connections if below minimum
    while (this.connections.length < this.options.minConnections) {
      this.factory()
        .then(connection => {
          connection.inUse = false;
          connection.lastUsed = Date.now();
          this.connections.push(connection);
        })
        .catch(error => {
          console.error('[ConnectionPool] Failed to create replacement connection:', error);
        });
      break;
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const now = Date.now();
    const idleConnections = this.connections.filter(conn => !conn.inUse);
    const activeConnections = this.connections.filter(conn => conn.inUse);
    const idleConnectionsToReap = idleConnections.filter(
      conn => now - conn.lastUsed > this.options.idleTimeoutMs
    );

    return {
      total: this.connections.length,
      active: activeConnections.length,
      idle: idleConnections.length,
      waiting: this.waitingQueue.length,
      toReap: idleConnectionsToReap.length,
      minConnections: this.options.minConnections,
      maxConnections: this.options.maxConnections,
    };
  }

  /**
   * Close all connections and shutdown pool
   */
  async close(): Promise<void> {
    // Stop reaper
    if (this.reapTimer) {
      clearInterval(this.reapTimer);
      this.reapTimer = null;
    }

    // Reject waiting connections
    while (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift()!;
      clearTimeout(waiting.timeout);
      waiting.reject(new Error('Pool is closing'));
    }

    // Close all connections
    await Promise.all(
      this.connections.map(conn => conn.close())
    );

    this.connections = [];
  }
}

/**
 * HTTP Connection Pool for fetch requests
 */
export class HttpConnectionPool extends ConnectionPool<PooledConnection & {
  url: string;
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}> {
  constructor(baseUrl: string, options: ConnectionPoolOptions = {}) {
    super(async () => {
      return {
        id: `http-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        inUse: false,
        url: baseUrl,
        close(): Promise<void> {
          return Promise.resolve();
        },
        fetch: fetch.bind(globalThis),
      };
    }, options);
  }

  /**
   * Make a request using a pooled connection
   */
  async request(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const connection = await this.acquire();
    try {
      const response = await connection.fetch(input, init);
      return response;
    } finally {
      await this.release(connection);
    }
  }
}

/**
 * Factory for creating connection pools
 */
export class ConnectionPoolFactory {
  private pools = new Map<string, ConnectionPool<any>>();

  /**
   * Get or create a connection pool
   */
  getPool<T extends PooledConnection>(
    name: string,
    factory: () => Promise<T>,
    options?: ConnectionPoolOptions
  ): ConnectionPool<T> {
    if (!this.pools.has(name)) {
      const pool = new ConnectionPool(factory, options);
      this.pools.set(name, pool);
    }
    return this.pools.get(name)!;
  }

  /**
   * Get or create an HTTP connection pool
   */
  getHttpPool(baseUrl: string, options?: ConnectionPoolOptions): HttpConnectionPool {
    const name = `http-${baseUrl}`;
    if (!this.pools.has(name)) {
      const pool = new HttpConnectionPool(baseUrl, options);
      this.pools.set(name, pool);
    }
    return this.pools.get(name)! as HttpConnectionPool;
  }

  /**
   * Get all pool statistics
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getStats();
    }
    return stats;
  }

  /**
   * Close all pools
   */
  async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.pools.values()).map(pool => pool.close())
    );
    this.pools.clear();
  }
}

// Export singleton factory
export const connectionPoolFactory = new ConnectionPoolFactory();

// Pre-configured pools for common APIs

/**
 * Replicate API connection pool
 */
export const getReplicatePool = (): HttpConnectionPool => {
  return connectionPoolFactory.getHttpPool('https://api.replicate.com/v1', {
    maxConnections: 10,
    minConnections: 2,
    idleTimeoutMs: 300000, // 5 minutes
  });
};

/**
 * OpenAI API connection pool
 */
export const getOpenAIPool = (): HttpConnectionPool => {
  return connectionPoolFactory.getHttpPool('https://api.openai.com/v1', {
    maxConnections: 20,
    minConnections: 5,
    idleTimeoutMs: 300000,
  });
};

/**
 * Anthropic API connection pool
 */
export const getAnthropicPool = (): HttpConnectionPool => {
  return connectionPoolFactory.getHttpPool('https://api.anthropic.com/v1', {
    maxConnections: 15,
    minConnections: 3,
    idleTimeoutMs: 300000,
  });
};
