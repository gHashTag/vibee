/**
 * Unit Tests for Stats Command
 * Test Telegram command for displaying statistics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatsCommand } from '../../../src/commands/StatsCommand';
import type { IAgentRuntime } from '@elizaos/core';

describe('StatsCommand', () => {
  let command: StatsCommand;
  let mockRuntime: IAgentRuntime;
  let mockTelegram: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime = {
      getSetting: vi.fn(),
      databaseAdapter: {
        query: vi.fn(),
      },
    } as any;

    mockTelegram = {
      sendMessage: vi.fn(),
      sendPhoto: vi.fn(),
      sendDocument: vi.fn(),
    };

    command = new StatsCommand(mockRuntime, mockTelegram);
  });

  describe('Command Initialization', () => {
    it('should create stats command with correct name', () => {
      expect(command.name).toBe('stats');
      expect(command.description).toContain('statistics');
    });

    it('should have correct aliases', () => {
      expect(command.aliases).toContain('stat');
      expect(command.aliases).toContain('statistics');
    });
  });

  describe('User Statistics', () => {
    it('should display user statistics', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          {
            total_generations: 45,
            total_spent: 2.75,
            favorite_model: 'flux-dev',
            last_generation: '2024-01-15T10:30:00Z',
          },
        ],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats',
        args: [],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('45');
      expect(callArgs[1].text).toContain('$2.75');
      expect(callArgs[1].text).toContain('flux-dev');
    });

    it('should handle new user (no stats)', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats',
        args: [],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('No statistics yet');
    });

    it('should show usage breakdown by model', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          {
            total_generations: 30,
            total_spent: 1.80,
            flux_dev_count: 15,
            flux_pro_count: 10,
            seedream_count: 5,
          },
        ],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats',
        args: [],
      });

      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('flux-dev');
      expect(callArgs[1].text).toContain('flux-pro');
      expect(callArgs[1].text).toContain('seedream');
    });
  });

  describe('Global Statistics', () => {
    it('should display global statistics for admin', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          {
            total_users: 1250,
            total_generations: 15600,
            total_revenue: 890.50,
            active_users_24h: 234,
            active_users_7d: 567,
          },
        ],
      });

      await command.execute({
        userId: 'admin-user',
        message: '/stats global',
        args: ['global'],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('1,250');
      expect(callArgs[1].text).toContain('15,600');
      expect(callArgs[1].text).toContain('$890.50');
    });

    it('should deny global stats for non-admin', async () => {
      await command.execute({
        userId: 'regular-user',
        message: '/stats global',
        args: ['global'],
      });

      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('Not authorized');
    });
  });

  describe('Model Statistics', () => {
    it('should show model popularity', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          { model: 'flux-dev', count: 4500 },
          { model: 'flux-pro', count: 3200 },
          { model: 'seedream', count: 2800 },
          { model: 'flux-schnell', count: 2100 },
        ],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats model',
        args: ['model'],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('flux-dev');
      expect(callArgs[1].text).toContain('4500');
      expect(callArgs[1].text).toContain('28.8%'); // Popularity percentage
    });

    it('should handle empty model stats', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats model',
        args: ['model'],
      });

      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('No data available');
    });
  });

  describe('Time Period Filtering', () => {
    it('should filter by day', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          {
            date: '2024-01-15',
            generations: 125,
            revenue: 6.25,
          },
        ],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats day',
        args: ['day'],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('125');
    });

    it('should filter by week', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          { week: '2024-W02', generations: 890, revenue: 45.50 },
        ],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats week',
        args: ['week'],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
    });

    it('should filter by month', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          { month: '2024-01', generations: 3400, revenue: 175.80 },
        ],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats month',
        args: ['month'],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    it('should export stats as CSV', async () => {
      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [
          { date: '2024-01-15', model: 'flux-dev', count: 25, cost: 1.25 },
          { date: '2024-01-15', model: 'flux-pro', count: 15, cost: 1.50 },
        ],
      });

      await command.execute({
        userId: 'user-123',
        message: '/stats export csv',
        args: ['export', 'csv'],
      });

      expect(mockTelegram.sendDocument).toHaveBeenCalled();
      const callArgs = mockTelegram.sendDocument.mock.calls[0];
      expect(callArgs[2].caption).toContain('Statistics export');
    });

    it('should export stats as JSON', async () => {
      await command.execute({
        userId: 'user-123',
        message: '/stats export json',
        args: ['export', 'json'],
      });

      expect(mockTelegram.sendDocument).toHaveBeenCalled();
      const callArgs = mockTelegram.sendDocument.mock.calls[0];
      expect(callArgs[2].caption).toContain('JSON');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRuntime.databaseAdapter.query.mockRejectedValueOnce(
        new Error('Database connection error')
      );

      await command.execute({
        userId: 'user-123',
        message: '/stats',
        args: [],
      });

      expect(mockTelegram.sendMessage).toHaveBeenCalled();
      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('Error');
      expect(callArgs[1].text).toContain('database');
    });

    it('should handle missing arguments', async () => {
      await command.execute({
        userId: 'user-123',
        message: '/stats',
        args: [],
      });

      // Should default to user stats
      expect(mockRuntime.databaseAdapter.query).toHaveBeenCalled();
    });

    it('should validate export format', async () => {
      await command.execute({
        userId: 'user-123',
        message: '/stats export invalid',
        args: ['export', 'invalid'],
      });

      const callArgs = mockTelegram.sendMessage.mock.calls[0];
      expect(callArgs[1].text).toContain('Invalid export format');
    });
  });

  describe('Formatting', () => {
    it('should format numbers correctly', () => {
      const formatter = command['formatNumber'];

      expect(formatter(1000)).toBe('1,000');
      expect(formatter(1000000)).toBe('1,000,000');
      expect(formatter(123.456)).toBe('123.46');
    });

    it('should format currency correctly', () => {
      const formatter = command['formatCurrency'];

      expect(formatter(1.5)).toBe('$1.50');
      expect(formatter(0)).toBe('$0.00');
      expect(formatter(100)).toBe('$100.00');
    });

    it('should format percentage correctly', () => {
      const formatter = command['formatPercentage'];

      expect(formatter(25, 100)).toBe('25.0%');
      expect(formatter(33, 100)).toBe('33.0%');
      expect(formatter(50, 200)).toBe('25.0%');
    });
  });

  describe('Caching', () => {
    it('should cache global stats for 5 minutes', async () => {
      const now = Date.now();

      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [{ total_users: 100 }],
      });

      await command.getGlobalStats();
      await command.getGlobalStats();

      expect(mockRuntime.databaseAdapter.query).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache after expiry', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: [{ total_users: 100 }],
      });

      await command.getGlobalStats();

      // Advance time by 6 minutes
      vi.setSystemTime(now + 6 * 60 * 1000);

      await command.getGlobalStats();

      expect(mockRuntime.databaseAdapter.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        model: `model-${i % 10}`,
        count: Math.floor(Math.random() * 1000),
      }));

      mockRuntime.databaseAdapter.query.mockResolvedValueOnce({
        rows: largeDataset,
      });

      const start = Date.now();
      await command.execute({
        userId: 'user-123',
        message: '/stats model',
        args: ['model'],
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(mockTelegram.sendMessage).toHaveBeenCalled();
    });
  });
});
