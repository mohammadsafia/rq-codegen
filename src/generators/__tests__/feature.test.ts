import { describe, it, expect } from 'vitest';

import { featureFields, featureActions, type FeatureAnswers } from '../feature.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

describe('featureFields', () => {
  it('returns fields array', () => {
    const fields = featureFields();
    expect(Array.isArray(fields)).toBe(true);
  });

  it('has name, singularName, endpointKey fields', () => {
    const fields = featureFields();
    expect(fields.find((f) => f.name === 'name')).toBeDefined();
    expect(fields.find((f) => f.name === 'singularName')).toBeDefined();
    expect(fields.find((f) => f.name === 'endpointKey')).toBeDefined();
  });

  it('has artifacts checkbox', () => {
    const fields = featureFields();
    const artifacts = fields.find((f) => f.name === 'artifacts');
    expect(artifacts).toBeDefined();
    expect(artifacts!.type).toBe('checkbox');
  });

  it('has isPaginated field', () => {
    const fields = featureFields();
    expect(fields.find((f) => f.name === 'isPaginated')).toBeDefined();
  });
});

describe('featureActions', () => {
  const baseAnswers: FeatureAnswers = {
    name: 'Community',
    singularName: 'community',
    endpointKey: 'COMMUNITY',
    artifacts: [
      'types',
      'handler',
      'queryList',
      'queryDetails',
      'mutationCreate',
      'mutationUpdate',
      'mutationDelete',
      'view',
      'page',
      'validation',
    ],
    isPaginated: false,
  };

  it('generates actions for all selected artifacts', () => {
    const actions = featureActions(baseAnswers, DEFAULT_CONFIG);
    expect(actions.length).toBeGreaterThan(0);
  });

  it('generates types when types artifact selected', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['types'] },
      DEFAULT_CONFIG,
    );

    const typeAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'types-dto/dto.ts.hbs',
    );
    expect(typeAction).toBeDefined();
  });

  it('generates handler when handler artifact selected', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['handler'] },
      DEFAULT_CONFIG,
    );

    const handlerAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'handler/handler.ts.hbs',
    );
    expect(handlerAction).toBeDefined();
  });

  it('generates paginated query when queryList + isPaginated', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['queryList'], isPaginated: true },
      DEFAULT_CONFIG,
    );

    const paginatedAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'query-hook/hook-paginated.ts.hbs',
    );
    expect(paginatedAction).toBeDefined();
  });

  it('generates regular query when queryList + not paginated', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['queryList'], isPaginated: false },
      DEFAULT_CONFIG,
    );

    const queryAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'query-hook/hook.ts.hbs',
    );
    expect(queryAction).toBeDefined();
  });

  it('generates details query', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['queryDetails'] },
      DEFAULT_CONFIG,
    );

    const detailsAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'query-hook/hook-details.ts.hbs',
    );
    expect(detailsAction).toBeDefined();
  });

  it('generates mutation hooks for create, update, delete', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['mutationCreate', 'mutationUpdate', 'mutationDelete'] },
      DEFAULT_CONFIG,
    );

    const mutationActions = actions.filter(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'mutation-hook/hook.ts.hbs',
    );
    expect(mutationActions).toHaveLength(3);
  });

  it('generates view component', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['view'] },
      DEFAULT_CONFIG,
    );

    const viewAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'view/View.tsx.hbs',
    );
    expect(viewAction).toBeDefined();
  });

  it('generates page component', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['page'] },
      DEFAULT_CONFIG,
    );

    const pageAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'page/Page.tsx.hbs',
    );
    expect(pageAction).toBeDefined();
  });

  it('generates validation schema', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: ['validation'] },
      DEFAULT_CONFIG,
    );

    const validationAction = actions.find(
      (a) =>
        a.type === 'add' &&
        'templateFile' in a &&
        a.templateFile === 'validation/validation.ts.hbs',
    );
    expect(validationAction).toBeDefined();
  });

  it('generates no actions when no artifacts selected', () => {
    const actions = featureActions(
      { ...baseAnswers, artifacts: [] },
      DEFAULT_CONFIG,
    );
    expect(actions).toHaveLength(0);
  });

  it('includes barrel-append actions for generated files', () => {
    const actions = featureActions(baseAnswers, DEFAULT_CONFIG);
    const barrelActions = actions.filter((a) => a.type === 'barrel-append');
    expect(barrelActions.length).toBeGreaterThan(0);
  });
});
