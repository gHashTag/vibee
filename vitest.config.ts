/**
 * Vitest Configuration
 * Comprehensive test configuration for Vibee project
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/node_modules/**',
        '**/.{idea,git,cache,output}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 90,
          statements: 90,
        },
        each: {
          branches: 75,
          functions: 80,
          lines: 85,
          statements: 85,
        },
      },
    },

    // Test files pattern
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/e2e/**/*.test.{ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.git',
      '.cache',
      'coverage',
      'tests/coverage/**/*.ts',
      'tests/**/*.d.ts',
    ],

    // Reporters
    reporters: ['verbose', 'html', 'json'],

    // Output directory
    outputFile: {
      json: 'tests/coverage/test-results.json',
      html: 'tests/coverage/report.html',
    },

    // Mock configuration
    mockReset: true,
    clearMocks: true,

    // Test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },

    // Watch mode
    watch: false,

    // Setup files
    setupFiles: ['tests/setup.ts'],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@tests': path.resolve(__dirname, 'tests'),
    },
  },

  // Optimizations
  esbuild: {
    target: 'node18',
  },

  // TypeScript
  tsconfig: 'tsconfig.json',
});
