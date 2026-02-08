import { describe, it, expect } from 'vitest';

import { getGenerators } from '../index.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

describe('getGenerators', () => {
  it('returns 12 generators', () => {
    const generators = getGenerators(DEFAULT_CONFIG);
    expect(generators).toHaveLength(12);
  });

  it('includes all expected generator names', () => {
    const generators = getGenerators(DEFAULT_CONFIG);
    const names = generators.map((g) => g.name);

    expect(names).toContain('component-ui');
    expect(names).toContain('component-shared');
    expect(names).toContain('component-form');
    expect(names).toContain('page');
    expect(names).toContain('view');
    expect(names).toContain('handler');
    expect(names).toContain('query-hook');
    expect(names).toContain('mutation-hook');
    expect(names).toContain('types-dto');
    expect(names).toContain('shared-hook');
    expect(names).toContain('validation');
    expect(names).toContain('feature');
  });

  it('each generator has name and description', () => {
    const generators = getGenerators(DEFAULT_CONFIG);
    for (const gen of generators) {
      expect(gen.name).toBeTruthy();
      expect(gen.description).toBeTruthy();
    }
  });

  it('each generator has prompts and actions functions', () => {
    const generators = getGenerators(DEFAULT_CONFIG);
    for (const gen of generators) {
      expect(typeof gen.prompts).toBe('function');
      expect(typeof gen.actions).toBe('function');
    }
  });

  it('preprocess is optional', () => {
    const generators = getGenerators(DEFAULT_CONFIG);
    const withPreprocess = generators.filter((g) => g.preprocess);
    const withoutPreprocess = generators.filter((g) => !g.preprocess);

    expect(withPreprocess.length).toBeGreaterThan(0);
    expect(withoutPreprocess.length).toBeGreaterThan(0);
  });

  it('component-shared has preprocess function', () => {
    const generators = getGenerators(DEFAULT_CONFIG);
    const shared = generators.find((g) => g.name === 'component-shared');
    expect(shared?.preprocess).toBeDefined();
  });

  it('page has preprocess function', () => {
    const generators = getGenerators(DEFAULT_CONFIG);
    const page = generators.find((g) => g.name === 'page');
    expect(page?.preprocess).toBeDefined();
  });
});
