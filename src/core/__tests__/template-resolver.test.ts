import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { resolveTemplatePath } from '../template-resolver.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';
import type { RqCodegenConfig } from '../../config/types.js';

const TEST_DIR = path.join(os.tmpdir(), 'rq-codegen-template-resolver-test');

let config: RqCodegenConfig;

beforeEach(() => {
  config = { ...DEFAULT_CONFIG };
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('resolveTemplatePath', () => {
  it('resolves bundled template when no templatesDir', () => {
    const result = resolveTemplatePath('component-ui/Component.tsx.hbs', config);
    expect(result).toContain('templates');
    expect(result).toContain('component-ui');
    expect(result).toContain('Component.tsx.hbs');
    expect(fs.existsSync(result)).toBe(true);
  });

  it('resolves bundled template for all template types', () => {
    const templates = [
      'component-ui/Component.tsx.hbs',
      'component-ui/index.ts.hbs',
      'component-shared/Component.tsx.hbs',
      'component-form/FormComponent.tsx.hbs',
      'handler/handler.ts.hbs',
      'query-hook/hook.ts.hbs',
      'query-hook/hook-details.ts.hbs',
      'query-hook/hook-paginated.ts.hbs',
      'mutation-hook/hook.ts.hbs',
      'types-dto/dto.ts.hbs',
      'shared-hook/hook.ts.hbs',
      'validation/validation.ts.hbs',
      'page/Page.tsx.hbs',
      'view/View.tsx.hbs',
      'view/index.ts.hbs',
    ];

    for (const template of templates) {
      const result = resolveTemplatePath(template, config);
      expect(fs.existsSync(result), `Template ${template} should exist`).toBe(true);
    }
  });

  it('prefers local template when templatesDir is set', () => {
    const localDir = path.join(TEST_DIR, 'my-templates');
    fs.mkdirSync(path.join(localDir, 'component-ui'), { recursive: true });
    fs.writeFileSync(
      path.join(localDir, 'component-ui', 'Component.tsx.hbs'),
      'local override',
    );

    config.templatesDir = localDir;
    const result = resolveTemplatePath('component-ui/Component.tsx.hbs', config);
    expect(result).toContain(localDir);
    expect(fs.readFileSync(result, 'utf-8')).toBe('local override');
  });

  it('falls back to bundled when local template does not exist', () => {
    const localDir = path.join(TEST_DIR, 'my-templates');
    fs.mkdirSync(localDir, { recursive: true });

    config.templatesDir = localDir;
    const result = resolveTemplatePath('component-ui/Component.tsx.hbs', config);
    expect(result).not.toContain(localDir);
    expect(fs.existsSync(result)).toBe(true);
  });

  it('throws when template does not exist in either location', () => {
    expect(() => {
      resolveTemplatePath('nonexistent/template.hbs', config);
    }).toThrow();
  });

  it('throws descriptive error with search paths', () => {
    const localDir = path.join(TEST_DIR, 'my-templates');
    config.templatesDir = localDir;

    try {
      resolveTemplatePath('nonexistent/template.hbs', config);
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toContain('nonexistent/template.hbs');
    }
  });
});
