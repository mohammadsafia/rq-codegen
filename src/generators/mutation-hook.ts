import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { validateName } from '../utils/validation.js';

export type MutationHookAnswers = {
  mutationName: string;
  handlerName: string;
  handlerKey: string;
  invalidateKey: string;
};

export function mutationHookFields(): GeneratorField[] {
  return [
    { name: 'mutationName', type: 'input', message: 'Mutation name (e.g., CreateCommunity, UpdateUser):', required: true, validate: validateName },
    { name: 'handlerName', type: 'input', message: 'Handler name to import (e.g., Community):', required: true, validate: validateName },
    { name: 'handlerKey', type: 'input', message: 'Handler mutation key (e.g., create, update, remove):', default: 'create' },
    { name: 'invalidateKey', type: 'input', message: 'Handler query key to invalidate on success (e.g., list):', default: 'list' },
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
