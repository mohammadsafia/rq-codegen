import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { fieldsToPrompts } from '../core/fields.js';

import { componentUiFields, componentUiActions } from './component-ui.js';
import { componentSharedFields, componentSharedActions, preprocessComponentSharedAnswers } from './component-shared.js';
import { componentFormFields, componentFormActions } from './component-form.js';
import { pageFields, pageActions, preprocessPageAnswers } from './page.js';
import { viewFields, viewActions, preprocessViewAnswers } from './view.js';
import { handlerFields, handlerActions } from './handler.js';
import { queryHookFields, queryHookActions } from './query-hook.js';
import { mutationHookFields, mutationHookActions } from './mutation-hook.js';
import { typesDtoFields, typesDtoActions } from './types-dto.js';
import { sharedHookFields, sharedHookActions } from './shared-hook.js';
import { validationFields, validationActions } from './validation.js';
import { featureFields, featureActions } from './feature.js';

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
      fields: () => componentUiFields(),
      prompts: () => fieldsToPrompts(componentUiFields()),
      actions: (answers, cfg) => componentUiActions(answers as never, cfg),
    },
    {
      name: 'component-shared',
      description: 'Compound shared component',
      fields: () => componentSharedFields(),
      prompts: () => fieldsToPrompts(componentSharedFields()),
      actions: (answers, cfg) => componentSharedActions(answers as never, cfg),
      preprocess: (answers) => preprocessComponentSharedAnswers(answers as never),
    },
    {
      name: 'component-form',
      description: 'React Hook Form component (useController-based)',
      fields: () => componentFormFields(),
      prompts: () => fieldsToPrompts(componentFormFields()),
      actions: (answers, cfg) => componentFormActions(answers as never, cfg),
    },
    {
      name: 'page',
      description: 'Route-level page component',
      fields: (cfg) => pageFields(cfg),
      prompts: (cfg) => fieldsToPrompts(pageFields(cfg)),
      actions: (answers, cfg) => pageActions(answers as never, cfg),
      preprocess: (answers) => preprocessPageAnswers(answers as never),
    },
    {
      name: 'view',
      description: 'Feature view component',
      fields: (cfg) => viewFields(cfg),
      prompts: (cfg) => fieldsToPrompts(viewFields(cfg)),
      actions: (answers, cfg) => viewActions(answers as never, cfg),
      preprocess: (answers) => preprocessViewAnswers(answers as never),
    },
    {
      name: 'handler',
      description: 'API handler (+ types + hooks)',
      fields: () => handlerFields(),
      prompts: () => fieldsToPrompts(handlerFields()),
      actions: (answers, cfg) => handlerActions(answers as never, cfg),
    },
    {
      name: 'query-hook',
      description: 'React Query hook',
      fields: () => queryHookFields(),
      prompts: () => fieldsToPrompts(queryHookFields()),
      actions: (answers, cfg) => queryHookActions(answers as never, cfg),
    },
    {
      name: 'mutation-hook',
      description: 'React Query mutation hook',
      fields: () => mutationHookFields(),
      prompts: () => fieldsToPrompts(mutationHookFields()),
      actions: (answers, cfg) => mutationHookActions(answers as never, cfg),
    },
    {
      name: 'types-dto',
      description: 'DTO type definitions',
      fields: () => typesDtoFields(),
      prompts: () => fieldsToPrompts(typesDtoFields()),
      actions: (answers, cfg) => typesDtoActions(answers as never, cfg),
    },
    {
      name: 'shared-hook',
      description: 'Custom utility hook',
      fields: () => sharedHookFields(),
      prompts: () => fieldsToPrompts(sharedHookFields()),
      actions: (answers, cfg) => sharedHookActions(answers as never, cfg),
    },
    {
      name: 'validation',
      description: 'Zod validation schema',
      fields: () => validationFields(),
      prompts: () => fieldsToPrompts(validationFields()),
      actions: (answers, cfg) => validationActions(answers as never, cfg),
    },
    {
      name: 'feature',
      description: 'Full feature scaffold (handler + types + hooks + view + page)',
      fields: () => featureFields(),
      prompts: () => fieldsToPrompts(featureFields()),
      actions: (answers, cfg) => featureActions(answers as never, cfg),
    },
  ];
}
