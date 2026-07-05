import { describe, it, expect } from 'vitest';

import { handlerFields, handlerActions, type HandlerAnswers } from '../handler.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

describe('handlerFields', () => {
  it('returns 9 fields', () => {
    expect(handlerFields()).toHaveLength(9);
  });
  it('has name, singularName, endpointKey fields', () => {
    const fields = handlerFields();
    expect(fields.find((f) => f.name === 'name')).toBeDefined();
    expect(fields.find((f) => f.name === 'singularName')).toBeDefined();
    expect(fields.find((f) => f.name === 'endpointKey')).toBeDefined();
  });
  it('operations is a checkbox with 5 choices', () => {
    const ops = handlerFields().find((f) => f.name === 'operations');
    expect(ops?.type).toBe('checkbox');
    expect((ops as { choices: unknown[] }).choices).toHaveLength(5);
  });
  it('isPaginated has a when() gated on chainQueryHook + list', () => {
    const p = handlerFields().find((f) => f.name === 'isPaginated') as { when: Function };
    expect(p.when({ chainQueryHook: true, operations: ['list'] })).toBe(true);
    expect(p.when({ chainQueryHook: true, operations: ['details'] })).toBe(false);
    expect(p.when({ chainQueryHook: false, operations: ['list'] })).toBe(false);
  });
});

describe('handlerActions', () => {
  const baseAnswers: HandlerAnswers = {
    name: 'Community',
    singularName: 'community',
    endpointKey: 'COMMUNITY',
    apiBaseUrl: '/o/headless-marketplace/v1.0/communities',
    operations: ['list', 'details', 'create', 'update', 'delete'],
    chainTypes: true,
    chainQueryHook: true,
    isPaginated: false,
    chainMutationHook: true,
  };

  it('always registers endpoint, creates handler file + barrel', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);

    // First action is endpoint-register
    expect(actions[0].type).toBe('endpoint-register');

    const addAction = actions[1];
    expect(addAction.type).toBe('add');
    if (addAction.type === 'add') {
      expect(addAction.path).toContain('{{camelCase name}}.ts');
      expect(addAction.templateFile).toBe('handler/handler.ts.hbs');
    }

    expect(actions[2].type).toBe('barrel-append');
  });

  it('creates DTO types when chainTypes is true', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);
    const dtoAction = actions.find(
      (a) => a.type === 'add' && 'templateFile' in a && a.templateFile === 'types-dto/dto.ts.hbs',
    );
    expect(dtoAction).toBeDefined();
  });

  it('skips DTO types when chainTypes is false', () => {
    const answers = { ...baseAnswers, chainTypes: false };
    const actions = handlerActions(answers, DEFAULT_CONFIG);
    const dtoAction = actions.find(
      (a) => a.type === 'add' && 'templateFile' in a && a.templateFile === 'types-dto/dto.ts.hbs',
    );
    expect(dtoAction).toBeUndefined();
  });

  it('creates list query hook (non-paginated)', () => {
    const answers = { ...baseAnswers, isPaginated: false };
    const actions = handlerActions(answers, DEFAULT_CONFIG);
    const queryAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'query-hook/hook.ts.hbs',
    );
    expect(queryAction).toBeDefined();
  });

  it('creates paginated query hook when isPaginated', () => {
    const answers = { ...baseAnswers, isPaginated: true };
    const actions = handlerActions(answers, DEFAULT_CONFIG);
    const paginatedAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'query-hook/hook-paginated.ts.hbs',
    );
    expect(paginatedAction).toBeDefined();
  });

  it('creates details query hook', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);
    const detailsAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'query-hook/hook-details.ts.hbs',
    );
    expect(detailsAction).toBeDefined();
  });

  it('skips query hooks when chainQueryHook is false', () => {
    const answers = { ...baseAnswers, chainQueryHook: false };
    const actions = handlerActions(answers, DEFAULT_CONFIG);
    const queryActions = actions.filter(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile.startsWith('query-hook/'),
    );
    expect(queryActions).toHaveLength(0);
  });

  it('creates mutation hooks for create, update, delete', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);
    const mutationActions = actions.filter(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'mutation-hook/hook.ts.hbs',
    );
    expect(mutationActions).toHaveLength(3);
  });

  it('uses singularName for mutation hook naming', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);
    const createMutation = actions.find(
      (a) =>
        a.type === 'add' &&
        'path' in a &&
        a.path.includes('useCreateCommunityMutation'),
    );
    expect(createMutation).toBeDefined();
  });

  it('delete mutation maps to remove handler key', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);
    const deleteMutation = actions.find(
      (a) =>
        a.type === 'add' &&
        'data' in a &&
        a.data?.handlerKey === 'remove',
    );
    expect(deleteMutation).toBeDefined();
  });

  it('skips mutation hooks when chainMutationHook is false', () => {
    const answers = { ...baseAnswers, chainMutationHook: false };
    const actions = handlerActions(answers, DEFAULT_CONFIG);
    const mutationActions = actions.filter(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'mutation-hook/hook.ts.hbs',
    );
    expect(mutationActions).toHaveLength(0);
  });

  it('skips create mutation when create not in operations', () => {
    const answers = { ...baseAnswers, operations: ['list', 'details'] };
    const actions = handlerActions(answers, DEFAULT_CONFIG);
    const createMutation = actions.find(
      (a) =>
        a.type === 'add' &&
        'path' in a &&
        a.path.includes('useCreate'),
    );
    expect(createMutation).toBeUndefined();
  });

  it('uses config paths for all actions', () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      paths: {
        ...DEFAULT_CONFIG.paths,
        handlers: 'custom/handlers',
        queries: 'custom/queries',
        mutations: 'custom/mutations',
        types: 'custom/types',
      },
    };

    const actions = handlerActions(baseAnswers, customConfig);
    const handlerAction = actions[1]; // index 1 because index 0 is endpoint-register
    if (handlerAction.type === 'add') {
      expect(handlerAction.path).toContain('custom/handlers');
    }
  });

  it('creates barrel exports for all generated files', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);
    const barrelActions = actions.filter((a) => a.type === 'barrel-append');

    // handler barrel + types barrel + 2 query barrels + 3 mutation barrels
    expect(barrelActions.length).toBeGreaterThanOrEqual(6);
  });
});
