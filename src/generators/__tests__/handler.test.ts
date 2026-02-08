import { describe, it, expect } from 'vitest';

import { handlerPrompts, handlerActions, type HandlerAnswers } from '../handler.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

describe('handlerPrompts', () => {
  it('returns 8 prompts', () => {
    const prompts = handlerPrompts();
    expect(prompts).toHaveLength(8);
  });

  it('has name, singularName, endpointKey prompts', () => {
    const prompts = handlerPrompts();
    expect(prompts.find((p) => p.name === 'name')).toBeDefined();
    expect(prompts.find((p) => p.name === 'singularName')).toBeDefined();
    expect(prompts.find((p) => p.name === 'endpointKey')).toBeDefined();
  });

  it('has operations checkbox with 5 choices', () => {
    const prompts = handlerPrompts();
    const ops = prompts.find((p) => p.name === 'operations');
    expect(ops).toBeDefined();
    expect(ops!.type).toBe('checkbox');
    expect((ops as { choices: unknown[] }).choices).toHaveLength(5);
  });

  it('has conditional isPaginated prompt', () => {
    const prompts = handlerPrompts();
    const paginated = prompts.find((p) => p.name === 'isPaginated');
    expect(paginated).toBeDefined();
    expect(paginated!.type).toBe('confirm');
    expect(typeof (paginated as { when: Function }).when).toBe('function');
  });

  it('isPaginated shows only when chainQueryHook and list selected', () => {
    const prompts = handlerPrompts();
    const paginated = prompts.find((p) => p.name === 'isPaginated') as { when: Function };

    // Shows when both conditions true
    expect(paginated.when({ chainQueryHook: true, operations: ['list'] })).toBe(true);

    // Hidden when no list
    expect(paginated.when({ chainQueryHook: true, operations: ['details'] })).toBe(false);

    // Hidden when chainQueryHook false
    expect(paginated.when({ chainQueryHook: false, operations: ['list'] })).toBe(false);
  });
});

describe('handlerActions', () => {
  const baseAnswers: HandlerAnswers = {
    name: 'Community',
    singularName: 'community',
    endpointKey: 'COMMUNITY',
    operations: ['list', 'details', 'create', 'update', 'delete'],
    chainTypes: true,
    chainQueryHook: true,
    isPaginated: false,
    chainMutationHook: true,
  };

  it('always creates handler file + barrel', () => {
    const actions = handlerActions(baseAnswers, DEFAULT_CONFIG);

    const addAction = actions[0];
    expect(addAction.type).toBe('add');
    if (addAction.type === 'add') {
      expect(addAction.path).toContain('{{camelCase name}}.ts');
      expect(addAction.templateFile).toBe('handler/handler.ts.hbs');
    }

    expect(actions[1].type).toBe('barrel-append');
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
    const handlerAction = actions[0];
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
