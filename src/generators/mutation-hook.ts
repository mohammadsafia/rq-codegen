import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { validateName } from '../utils/validation.js';

export type MutationHookAnswers = {
  mutationName: string;
  handlerName: string;
  handlerKey: string;
  invalidateKey: string;
};

export function mutationHookPrompts() {
  return [
    {
      type: 'input' as const,
      name: 'mutationName',
      message: 'Mutation name (e.g., CreateCommunity, UpdateUser):',
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
      message: 'Handler mutation key (e.g., create, update, remove):',
      default: 'create',
    },
    {
      type: 'input' as const,
      name: 'invalidateKey',
      message: 'Handler query key to invalidate on success (e.g., list):',
      default: 'list',
    },
  ];
}

export function mutationHookActions(
  _answers: MutationHookAnswers,
  config: RqCodegenConfig,
): GeneratorAction[] {
  return [
    {
      type: 'add',
      path: `${config.paths.mutations}/use{{pascalCase mutationName}}Mutation.ts`,
      templateFile: 'mutation-hook/hook.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${config.paths.mutations}/index.ts`,
      exportLine: "export * from './use{{pascalCase mutationName}}Mutation';",
    },
  ];
}
