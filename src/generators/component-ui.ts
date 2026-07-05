import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { validateName } from '../utils/validation.js';

export type ComponentUiAnswers = {
  name: string;
};

export function componentUiFields(): GeneratorField[] {
  return [
    { name: 'name', type: 'input', message: 'Component name (e.g., StatusIndicator):', required: true, validate: validateName },
  ];
}

export function componentUiActions(
  _answers: ComponentUiAnswers,
  config: RqCodegenConfig,
): GeneratorAction[] {
  const basePath = config.paths.uiComponents;

  return [
    {
      type: 'add',
      path: `${basePath}/{{kebabCase name}}/{{pascalCase name}}.tsx`,
      templateFile: 'component-ui/Component.tsx.hbs',
    },
    {
      type: 'add',
      path: `${basePath}/{{kebabCase name}}/index.ts`,
      templateFile: 'component-ui/index.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${basePath}/index.ts`,
      exportLine: "export * from './{{kebabCase name}}';",
    },
  ];
}
