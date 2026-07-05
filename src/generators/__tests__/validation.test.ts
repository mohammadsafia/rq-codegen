import { describe, it, expect } from 'vitest';

import { validationFields, validationActions } from '../validation.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

describe('validationFields', () => {
  it('returns a single required name field', () => {
    const fields = validationFields();
    expect(fields[0]).toMatchObject({ name: 'name', type: 'input', required: true });
  });
});

describe('validationActions', () => {
  it('creates 2 actions (schema file + barrel)', () => {
    const actions = validationActions({ name: 'Community' }, DEFAULT_CONFIG);
    expect(actions).toHaveLength(2);
  });

  it('creates schema file with correct suffix', () => {
    const actions = validationActions({ name: 'Community' }, DEFAULT_CONFIG);
    const addAction = actions[0];

    expect(addAction.type).toBe('add');
    if (addAction.type === 'add') {
      expect(addAction.path).toContain('.schema.ts');
      expect(addAction.path).toContain('{{camelCase name}}');
      expect(addAction.templateFile).toBe('validation/validation.ts.hbs');
    }
  });

  it('barrel export strips .ts from suffix', () => {
    const actions = validationActions({ name: 'Community' }, DEFAULT_CONFIG);
    const barrelAction = actions[1];

    expect(barrelAction.type).toBe('barrel-append');
    if (barrelAction.type === 'barrel-append') {
      expect(barrelAction.exportLine).toContain('.schema');
      expect(barrelAction.exportLine).not.toContain('.schema.ts');
    }
  });

  it('uses config paths', () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      paths: { ...DEFAULT_CONFIG.paths, validations: 'custom/validations' },
    };

    const actions = validationActions({ name: 'Community' }, customConfig);
    if (actions[0].type === 'add') {
      expect(actions[0].path).toContain('custom/validations');
    }
  });

  it('uses custom validation suffix', () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      naming: { ...DEFAULT_CONFIG.naming, validationSuffix: '.validator.ts' },
    };

    const actions = validationActions({ name: 'Community' }, customConfig);
    if (actions[0].type === 'add') {
      expect(actions[0].path).toContain('.validator.ts');
    }
    if (actions[1].type === 'barrel-append') {
      expect(actions[1].exportLine).toContain('.validator');
    }
  });
});
