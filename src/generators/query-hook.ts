import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { validateName } from '../utils/validation.js';

export type QueryHookAnswers = {
  name: string;
  handlerName: string;
  handlerKey: string;
  isDetailsQuery: boolean;
  isPaginated?: boolean;
};

export function queryHookFields(): GeneratorField[] {
  return [
    { name: 'name', type: 'input', message: 'Hook name suffix (e.g., CommunityList, ProductDetails):', required: true, validate: validateName },
    { name: 'handlerName', type: 'input', message: 'Handler name to import (e.g., Community):', required: true, validate: validateName },
    { name: 'handlerKey', type: 'input', message: 'Handler key (e.g., list, details):', default: 'list' },
    { name: 'isDetailsQuery', type: 'confirm', message: 'Is this a details/by-id query (takes an id parameter)?', default: false },
    { name: 'isPaginated', type: 'confirm', message: 'Is this a paginated list query?', default: false, when: (a) => !a.isDetailsQuery },
  ];
}

export function queryHookActions(answers: QueryHookAnswers, config: RqCodegenConfig): GeneratorAction[] {
  let templateFile: string;

  if (answers.isDetailsQuery) {
    templateFile = 'query-hook/hook-details.ts.hbs';
  } else if (answers.isPaginated) {
    templateFile = 'query-hook/hook-paginated.ts.hbs';
  } else {
    templateFile = 'query-hook/hook.ts.hbs';
  }

  return [
    {
      type: 'add',
      path: `${config.paths.queries}/use{{pascalCase name}}Query.ts`,
      templateFile,
      data: { hookName: answers.name },
    },
    {
      type: 'barrel-append',
      path: `${config.paths.queries}/index.ts`,
      exportLine: "export * from './use{{pascalCase name}}Query';",
    },
  ];
}
