import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { validateName } from '../utils/validation.js';

export type ComponentUiAnswers = {
  name: string;
};

export function componentUiPrompts() {
  return [
    {
      type: 'input' as const,
      name: 'name',
      message: 'Component name (e.g., StatusIndicator):',
      validate: validateName,
    },
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
