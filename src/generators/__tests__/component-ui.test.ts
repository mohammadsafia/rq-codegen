import { describe, it, expect } from 'vitest';

import { componentUiFields, componentUiActions, type ComponentUiAnswers } from '../component-ui.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

describe('componentUiFields', () => {
  it('returns a single required name field', () => {
    const fields = componentUiFields();
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ name: 'name', type: 'input', required: true });
  });
});

describe('componentUiActions', () => {
  it('generates 3 actions (component, index, barrel)', () => {
    const answers: ComponentUiAnswers = { name: 'StatusIndicator' };
    const actions = componentUiActions(answers, DEFAULT_CONFIG);
    expect(actions).toHaveLength(3);
  });

  it('first action creates component file', () => {
    const actions = componentUiActions({ name: 'StatusIndicator' }, DEFAULT_CONFIG);
    const addAction = actions[0];

    expect(addAction.type).toBe('add');
    if (addAction.type === 'add') {
      expect(addAction.path).toContain('{{kebabCase name}}');
      expect(addAction.path).toContain('{{pascalCase name}}.tsx');
      expect(addAction.templateFile).toBe('component-ui/Component.tsx.hbs');
    }
  });

  it('second action creates index file', () => {
    const actions = componentUiActions({ name: 'StatusIndicator' }, DEFAULT_CONFIG);
    const indexAction = actions[1];

    expect(indexAction.type).toBe('add');
    if (indexAction.type === 'add') {
      expect(indexAction.path).toContain('index.ts');
      expect(indexAction.templateFile).toBe('component-ui/index.ts.hbs');
    }
  });

  it('third action appends to barrel', () => {
    const actions = componentUiActions({ name: 'StatusIndicator' }, DEFAULT_CONFIG);
    const barrelAction = actions[2];

    expect(barrelAction.type).toBe('barrel-append');
    if (barrelAction.type === 'barrel-append') {
      expect(barrelAction.exportLine).toContain('{{kebabCase name}}');
    }
  });

  it('uses config paths', () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      paths: { ...DEFAULT_CONFIG.paths, uiComponents: 'custom/ui' },
    };
    const actions = componentUiActions({ name: 'StatusIndicator' }, customConfig);
    const addAction = actions[0];

    if (addAction.type === 'add') {
      expect(addAction.path).toContain('custom/ui');
    }
  });
});
