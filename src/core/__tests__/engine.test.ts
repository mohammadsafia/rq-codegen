import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { executeActions, resetHandlebars } from '../engine.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';
import type { RqCodegenConfig } from '../../config/types.js';

const TEST_DIR = path.join(os.tmpdir(), 'rq-codegen-engine-test');

let config: RqCodegenConfig;

beforeEach(() => {
  config = { ...DEFAULT_CONFIG, srcDir: '.' };
  fs.mkdirSync(TEST_DIR, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(TEST_DIR);
  resetHandlebars();
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('executeActions', () => {
  describe('add action', () => {
    it('creates file from template', async () => {
      const results = await executeActions(
        [
          {
            type: 'add',
            path: 'components/{{kebabCase name}}/{{pascalCase name}}.tsx',
            templateFile: 'component-ui/Component.tsx.hbs',
          },
        ],
        { name: 'StatusIndicator' },
        config,
      );

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('created');

      const outputFile = path.join(
        TEST_DIR,
        'components/status-indicator/StatusIndicator.tsx',
      );
      expect(fs.existsSync(outputFile)).toBe(true);

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('StatusIndicator');
    });

    it('skips if file already exists', async () => {
      const outputDir = path.join(TEST_DIR, 'components/status-indicator');
      fs.mkdirSync(outputDir, { recursive: true });
      fs.writeFileSync(
        path.join(outputDir, 'StatusIndicator.tsx'),
        'existing',
      );

      const results = await executeActions(
        [
          {
            type: 'add',
            path: 'components/{{kebabCase name}}/{{pascalCase name}}.tsx',
            templateFile: 'component-ui/Component.tsx.hbs',
          },
        ],
        { name: 'StatusIndicator' },
        config,
      );

      expect(results[0].type).toBe('skipped');
      // Original content preserved
      const content = fs.readFileSync(
        path.join(outputDir, 'StatusIndicator.tsx'),
        'utf-8',
      );
      expect(content).toBe('existing');
    });

    it('merges answers and action data', async () => {
      const results = await executeActions(
        [
          {
            type: 'add',
            path: 'handlers/{{camelCase name}}.ts',
            templateFile: 'handler/handler.ts.hbs',
            data: {
              operations: ['list', 'details'],
            },
          },
        ],
        { name: 'Community', singularName: 'community', endpointKey: 'COMMUNITY' },
        config,
      );

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('created');

      const outputFile = path.join(TEST_DIR, 'handlers/community.ts');
      expect(fs.existsSync(outputFile)).toBe(true);

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('CommunityHandler');
      expect(content).toContain('queryKey');
    });

    it('returns failed result on template error', async () => {
      const results = await executeActions(
        [
          {
            type: 'add',
            path: 'test.ts',
            templateFile: 'nonexistent/template.hbs',
          },
        ],
        {},
        config,
      );

      expect(results[0].type).toBe('failed');
      expect(results[0].message).toBeTruthy();
    });

    it('creates parent directories', async () => {
      await executeActions(
        [
          {
            type: 'add',
            path: 'deep/nested/dir/file.tsx',
            templateFile: 'component-ui/Component.tsx.hbs',
          },
        ],
        { name: 'Test' },
        config,
      );

      expect(
        fs.existsSync(path.join(TEST_DIR, 'deep/nested/dir')),
      ).toBe(true);
    });
  });

  describe('barrel-append action', () => {
    it('appends export to barrel file', async () => {
      const results = await executeActions(
        [
          {
            type: 'barrel-append',
            path: 'components/index.ts',
            exportLine: "export * from './{{kebabCase name}}';",
          },
        ],
        { name: 'StatusIndicator' },
        config,
      );

      expect(results[0].type).toBe('updated');
      const content = fs.readFileSync(
        path.join(TEST_DIR, 'components/index.ts'),
        'utf-8',
      );
      expect(content).toContain("export * from './status-indicator'");
    });
  });

  describe('multiple actions', () => {
    it('processes all actions sequentially', async () => {
      const results = await executeActions(
        [
          {
            type: 'add',
            path: 'components/{{kebabCase name}}/{{pascalCase name}}.tsx',
            templateFile: 'component-ui/Component.tsx.hbs',
          },
          {
            type: 'add',
            path: 'components/{{kebabCase name}}/index.ts',
            templateFile: 'component-ui/index.ts.hbs',
          },
          {
            type: 'barrel-append',
            path: 'components/index.ts',
            exportLine: "export * from './{{kebabCase name}}';",
          },
        ],
        { name: 'StatusIndicator' },
        config,
      );

      expect(results).toHaveLength(3);
      expect(results[0].type).toBe('created');
      expect(results[1].type).toBe('created');
      expect(results[2].type).toBe('updated');
    });
  });

  describe('empty actions', () => {
    it('returns empty results for empty actions', async () => {
      const results = await executeActions([], {}, config);
      expect(results).toHaveLength(0);
    });
  });
});

describe('resetHandlebars', () => {
  it('allows fresh handlebars instance', async () => {
    // First call creates instance
    await executeActions(
      [
        {
          type: 'add',
          path: 'test1.tsx',
          templateFile: 'component-ui/Component.tsx.hbs',
        },
      ],
      { name: 'Test1' },
      config,
    );

    // Reset
    resetHandlebars();

    // Second call creates fresh instance
    await executeActions(
      [
        {
          type: 'add',
          path: 'test2.tsx',
          templateFile: 'component-ui/Component.tsx.hbs',
        },
      ],
      { name: 'Test2' },
      config,
    );

    expect(fs.existsSync(path.join(TEST_DIR, 'test2.tsx'))).toBe(true);
  });
});
