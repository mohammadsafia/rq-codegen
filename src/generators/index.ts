import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';

import { componentUiPrompts, componentUiActions } from './component-ui.js';
import { componentSharedPrompts, componentSharedActions, preprocessComponentSharedAnswers } from './component-shared.js';
import { componentFormPrompts, componentFormActions } from './component-form.js';
import { pagePrompts, pageActions, preprocessPageAnswers } from './page.js';
import { viewPrompts, viewActions, preprocessViewAnswers } from './view.js';
import { handlerPrompts, handlerActions } from './handler.js';
import { queryHookPrompts, queryHookActions } from './query-hook.js';
import { mutationHookPrompts, mutationHookActions } from './mutation-hook.js';
import { typesDtoPrompts, typesDtoActions } from './types-dto.js';
import { sharedHookPrompts, sharedHookActions } from './shared-hook.js';
import { validationPrompts, validationActions } from './validation.js';
import { featurePrompts, featureActions } from './feature.js';

export type GeneratorDefinition = {
  name: string;
  description: string;
  fields?: (config: RqCodegenConfig) => GeneratorField[];
  prompts: (config: RqCodegenConfig) => unknown[];
  actions: (answers: Record<string, unknown>, config: RqCodegenConfig) => GeneratorAction[];
  preprocess?: (answers: Record<string, unknown>) => Record<string, unknown>;
};

export function getGenerators(_config: RqCodegenConfig): GeneratorDefinition[] {
  // _config is available for future use; generators access it via their actions callback
  return [
    {
      name: 'component-ui',
      description: 'CVA-based UI component (shadcn/ui style)',
      prompts: () => componentUiPrompts(),
      actions: (answers, cfg) => componentUiActions(answers as never, cfg),
    },
    {
      name: 'component-shared',
      description: 'Compound shared component',
      prompts: () => componentSharedPrompts(),
      actions: (answers, cfg) => componentSharedActions(answers as never, cfg),
      preprocess: (answers) => preprocessComponentSharedAnswers(answers as never),
    },
    {
      name: 'component-form',
      description: 'React Hook Form component (useController-based)',
      prompts: () => componentFormPrompts(),
      actions: (answers, cfg) => componentFormActions(answers as never, cfg),
    },
    {
      name: 'page',
      description: 'Route-level page component',
      prompts: (cfg) => pagePrompts(cfg),
      actions: (answers, cfg) => pageActions(answers as never, cfg),
      preprocess: (answers) => preprocessPageAnswers(answers as never),
    },
    {
      name: 'view',
      description: 'Feature view component',
      prompts: (cfg) => viewPrompts(cfg),
      actions: (answers, cfg) => viewActions(answers as never, cfg),
      preprocess: (answers) => preprocessViewAnswers(answers as never),
    },
    {
      name: 'handler',
      description: 'API handler (+ types + hooks)',
      prompts: () => handlerPrompts(),
      actions: (answers, cfg) => handlerActions(answers as never, cfg),
    },
    {
      name: 'query-hook',
      description: 'React Query hook',
      prompts: () => queryHookPrompts(),
      actions: (answers, cfg) => queryHookActions(answers as never, cfg),
    },
    {
      name: 'mutation-hook',
      description: 'React Query mutation hook',
      prompts: () => mutationHookPrompts(),
      actions: (answers, cfg) => mutationHookActions(answers as never, cfg),
    },
    {
      name: 'types-dto',
      description: 'DTO type definitions',
      prompts: () => typesDtoPrompts(),
      actions: (answers, cfg) => typesDtoActions(answers as never, cfg),
    },
    {
      name: 'shared-hook',
      description: 'Custom utility hook',
      prompts: () => sharedHookPrompts(),
      actions: (answers, cfg) => sharedHookActions(answers as never, cfg),
    },
    {
      name: 'validation',
      description: 'Zod validation schema',
      prompts: () => validationPrompts(),
      actions: (answers, cfg) => validationActions(answers as never, cfg),
    },
    {
      name: 'feature',
      description: 'Full feature scaffold (handler + types + hooks + view + page)',
      prompts: () => featurePrompts(),
      actions: (answers, cfg) => featureActions(answers as never, cfg),
    },
  ];
}
