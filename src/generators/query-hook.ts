import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { validateName } from '../utils/validation.js';

export type QueryHookAnswers = {
  name: string;
  handlerName: string;
  handlerKey: string;
  isDetailsQuery: boolean;
  isPaginated?: boolean;
};

export function queryHookPrompts() {
  return [
    {
      type: 'input' as const,
      name: 'name',
      message: 'Hook name suffix (e.g., CommunityList, ProductDetails):',
      validate: validateName,
    },
    {
      type: 'input' as const,
      name: 'handlerName',
      message: 'Handler name to import (e.g., Community):',
      validate: validateName,
    },
    {
      type: 'input' as const,
      name: 'handlerKey',
      message: 'Handler key (e.g., list, details):',
      default: 'list',
    },
    {
      type: 'confirm' as const,
      name: 'isDetailsQuery',
      message: 'Is this a details/by-id query (takes an id parameter)?',
      default: false,
    },
    {
      type: 'confirm' as const,
      name: 'isPaginated',
      message: 'Is this a paginated list query?',
      default: false,
      when: (answers: QueryHookAnswers) => !answers.isDetailsQuery,
    },
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
