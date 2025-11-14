import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PluginDiscoverer, createDiscoverer, discoverVibeePlugins } from '../../../src/plugins/core/plugin-discovery.js';
import { PluginType } from '../../../src/plugins/core/types.js';
import type { IPlugin } from '../../../src/plugins/core/plugin.interface.js';
import { readdir, stat } from 'fs/promises';

// Мокаем fs/promises
vi.mock('fs/promises', async () => {
  const actual = await vi.importActual<typeof import('fs/promises')>('fs/promises');
  return {
    ...actual,
    readdir: vi.fn(),
    stat: vi.fn(),
  };
});

// Мокаем glob
vi.mock('glob', async () => {
  return {
    glob: vi.fn(),
  };
});

describe('PluginDiscovery', () => {
  let mockLoader: any;
  let mockLogger: any;
  let mockStat: ReturnType<typeof vi.fn>;
  let mockReaddir: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLoader = {
      load: vi.fn(),
      validate: vi.fn(),
      getInfo: vi.fn(),
    };

    mockLogger = vi.fn();
    mockStat = vi.fn();
    mockReaddir = vi.fn();

    vi.mocked(stat).mockImplementation(mockStat);
    vi.mocked(readdir).mockImplementation(mockReaddir);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('BasePluginLoader', () => {
    let loader: any;

    beforeEach(() => {
      loader = new (PluginDiscoverer as any)().loader.constructor.name;
    });

    it('should validate plugin correctly', async () => {
      const validPlugin: IPlugin = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
        register: vi.fn(),
      };

      mockLoader.load = vi.fn().mockResolvedValue(validPlugin);

      const loaderInstance = new (PluginDiscoverer as any)({}, mockLoader, mockLogger).loader;
      const result = await loaderInstance.validate('/path/to/plugin.ts');

      expect(result).toBe(true);
    });

    it('should return false for invalid plugin', async () => {
      const invalidPlugin = { id: 'test' };

      mockLoader.load = vi.fn().mockResolvedValue(invalidPlugin);

      const loaderInstance = new (PluginDiscoverer as any)({}, mockLoader, mockLogger).loader;
      const result = await loaderInstance.validate('/path/to/plugin.ts');

      expect(result).toBe(false);
    });

    it('should get plugin info', async () => {
      const plugin: IPlugin = {
        id: 'test',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        dependencies: ['dep1'],
        register: vi.fn(),
      };

      mockLoader.load = vi.fn().mockResolvedValue(plugin);

      const loaderInstance = new (PluginDiscoverer as any)({}, mockLoader, mockLogger).loader;
      const info = await loaderInstance.getInfo('/path/to/plugin.ts');

      expect(info).toEqual({
        id: 'test',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test description',
        author: 'Test Author',
        type: PluginType.SCENE,
        dependencies: ['dep1'],
      });
    });

    it('should handle errors in getInfo', async () => {
      mockLoader.load = vi.fn().mockRejectedValue(new Error('Load error'));

      const loaderInstance = new (PluginDiscoverer as any)({}, mockLoader, mockLogger).loader;
      const info = await loaderInstance.getInfo('/path/to/plugin.ts');

      expect(info).toEqual({});
    });
  });

  describe('PluginDiscoverer', () => {
    let discoverer: PluginDiscoverer;

    beforeEach(() => {
      discoverer = new PluginDiscoverer({}, mockLoader, mockLogger);
    });

    it('should create discoverer with default patterns', () => {
      expect(discoverer).toBeInstanceOf(PluginDiscoverer);
    });

    it('should create discoverer with custom patterns', () => {
      const patterns = {
        pluginFiles: ['**/custom-*.ts'],
        exclude: ['**/excluded/**'],
        maxDepth: 3,
      };

      const discoverer = new PluginDiscoverer(patterns, mockLoader);
      expect(discoverer).toBeInstanceOf(PluginDiscoverer);
    });

    describe('isPluginFile', () => {
      it('should recognize plugin.ts files', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.isPluginFile('plugin.ts')).toBe(true);
      });

      it('should recognize plugin.js files', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.isPluginFile('plugin.js')).toBe(true);
      });

      it('should reject non-plugin files', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.isPluginFile('other.ts')).toBe(false);
        expect(discovererInstance.isPluginFile('plugin.tsx')).toBe(false);
      });
    });

    describe('shouldExclude', () => {
      it('should exclude node_modules', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.shouldExclude('node_modules/test')).toBe(true);
      });

      it('should exclude test files', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.shouldExclude('test.spec.ts')).toBe(true);
      });

      it('should not exclude valid plugin files', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.shouldExclude('src/plugins/test/plugin.ts')).toBe(false);
      });
    });

    describe('matchPattern', () => {
      it('should match wildcard patterns', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.matchPattern('/path/test/file.ts', '**/test/*.ts')).toBe(true);
      });

      it('should match substring patterns', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.matchPattern('/path/test/file.ts', 'test')).toBe(true);
      });

      it('should handle Windows paths', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.matchPattern('C:\\path\\test\\file.ts', '**/test/*.ts')).toBe(true);
      });
    });

    describe('removeDuplicates', () => {
      it('should remove duplicate plugins by id', () => {
        const discovererInstance = discoverer as any;
        const plugins = [
          { id: 'plugin1', name: 'Plugin 1' },
          { id: 'plugin2', name: 'Plugin 2' },
          { id: 'plugin1', name: 'Plugin 1 Duplicate' },
        ];

        const unique = discovererInstance.removeDuplicates(plugins);

        expect(unique).toHaveLength(2);
        expect(unique[0].name).toBe('Plugin 1');
        expect(unique[1].name).toBe('Plugin 2');
      });
    });

    describe('isVersionCompatible', () => {
      it('should return true for compatible versions', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.isVersionCompatible('1.5.0', '1.0.0')).toBe(true);
        expect(discovererInstance.isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
      });

      it('should return false for incompatible versions', () => {
        const discovererInstance = discoverer as any;
        expect(discovererInstance.isVersionCompatible('2.0.0', '1.0.0')).toBe(false);
        expect(discovererInstance.isVersionCompatible('1.0.0', '1.5.0')).toBe(false);
      });
    });

    describe('discover', () => {
      beforeEach(() => {
        mockStat.mockImplementation(async (path: string) => {
          if (path.includes('directory')) {
            return { isDirectory: () => true, isFile: () => false } as any;
          }
          return { isDirectory: () => false, isFile: () => true } as any;
        });

        mockReaddir.mockResolvedValue([]);
        mockLoader.getInfo.mockResolvedValue({
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'Test',
          author: 'Test',
          type: PluginType.SCENE,
        });
      });

      it('should discover plugins in directory', async () => {
        const searchPaths = ['/path/to/directory'];
        const result = await discoverer.discover(searchPaths);

        expect(result.found).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
      });

      it('should track errors during discovery', async () => {
        mockLoader.getInfo.mockRejectedValue(new Error('Plugin load error'));

        const searchPaths = ['/path/to/directory/plugin.ts'];
        const result = await discoverer.discover(searchPaths);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].path).toBe('/path/to/directory/plugin.ts');
      });

      it('should handle non-existent paths', async () => {
        mockStat.mockRejectedValue(new Error('Path not found'));

        const searchPaths = ['/non/existent/path'];
        const result = await discoverer.discover(searchPaths);

        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].error).toContain('Path not found');
      });
    });

    describe('quickDiscover', () => {
      beforeEach(() => {
        const globModule = vi.mocked(vi.importMock('glob'));
        globModule.glob.mockResolvedValue(['/path/to/plugin1.ts', '/path/to/plugin2.ts']);

        mockLoader.getInfo.mockImplementation(async (path: string) => {
          return {
            id: path.includes('plugin1') ? 'plugin1' : 'plugin2',
            name: path.includes('plugin1') ? 'Plugin 1' : 'Plugin 2',
            type: PluginType.SCENE,
          };
        });
      });

      it('should quickly discover plugin paths', async () => {
        const result = await discoverer.quickDiscover(['/path/to']);

        expect(result).toHaveLength(2);
        expect(result[0]).toBe('/path/to/plugin1.ts');
      });

      it('should filter by plugin type', async () => {
        const result = await discoverer.quickDiscover(['/path/to'], PluginType.SCENE);

        expect(result).toHaveLength(2);
      });
    });

    describe('discoverByTag', () => {
      beforeEach(() => {
        mockStat.mockReturnValue({ isDirectory: () => false, isFile: () => true } as any);
        mockReaddir.mockResolvedValue([]);
        mockLoader.getInfo.mockResolvedValue({
          id: 'test-plugin',
          name: 'Test Plugin',
          version: '1.0.0',
          description: 'AI-powered plugin',
          author: 'Test',
          type: PluginType.SCENE,
        });
      });

      it('should filter plugins by tag in name', async () => {
        const result = await discoverer.discoverByTag(['/path/to'], 'Test');

        expect(result.found[0].name).toContain('Test');
      });

      it('should filter plugins by tag in description', async () => {
        const result = await discoverer.discoverByTag(['/path/to'], 'AI');

        expect(result[0].description).toContain('AI');
      });

      it('should be case-insensitive', async () => {
        const result = await discoverer.discoverByTag(['/path/to'], 'ai');

        expect(result[0].description).toContain('AI');
      });
    });

    describe('checkCompatibility', () => {
      it('should return true for compatible version', async () => {
        mockLoader.getInfo.mockResolvedValue({
          id: 'test',
          version: '1.5.0',
        });

        const result = await discoverer.checkCompatibility('/path/to/plugin.ts', ['1.0.0', '1.5.0']);

        expect(result).toBe(true);
      });

      it('should return false for incompatible version', async () => {
        mockLoader.getInfo.mockResolvedValue({
          id: 'test',
          version: '2.0.0',
        });

        const result = await discoverer.checkCompatibility('/path/to/plugin.ts', ['1.0.0']);

        expect(result).toBe(false);
      });

      it('should return false when plugin version is missing', async () => {
        mockLoader.getInfo.mockResolvedValue({
          id: 'test',
        });

        const result = await discoverer.checkCompatibility('/path/to/plugin.ts', ['1.0.0']);

        expect(result).toBe(false);
      });

      it('should return false on error', async () => {
        mockLoader.getInfo.mockRejectedValue(new Error('Load error'));

        const result = await discoverer.checkCompatibility('/path/to/plugin.ts', ['1.0.0']);

        expect(result).toBe(false);
      });
    });
  });

  describe('createDiscoverer', () => {
    it('should create discoverer with provided patterns and loader', () => {
      const patterns = { pluginFiles: ['**/test.ts'] };
      const logger = vi.fn();

      const discoverer = createDiscoverer(patterns, logger);

      expect(discoverer).toBeInstanceOf(PluginDiscoverer);
    });
  });

  describe('PluginDiscoverer.createDefault', () => {
    it('should create default discoverer', () => {
      const discoverer = PluginDiscoverer.createDefault(mockLogger);

      expect(discoverer).toBeInstanceOf(PluginDiscoverer);
    });
  });

  describe('discoverVibeePlugins', () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (path: string) => {
        if (path.includes('exists')) {
          return { isDirectory: () => true } as any;
        }
        throw new Error('Not found');
      });
    });

    it('should discover plugins in Vibee project structure', async () => {
      const mockDiscoveredPlugin = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        type: PluginType.SCENE,
        state: 'unloaded' as any,
      };

      const mockDiscover = vi.fn().mockResolvedValue({
        found: [mockDiscoveredPlugin],
        errors: [],
      });

      const discoverer = {
        discover: mockDiscover,
      };

      vi.spyOn(PluginDiscoverer, 'createDefault').mockReturnValue(discoverer as any);

      const result = await discoverVibeePlugins('/project/root', mockLogger);

      expect(result.found).toHaveLength(1);
    });
  });
});
