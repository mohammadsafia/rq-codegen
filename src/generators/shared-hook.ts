import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import { validateName } from '../utils/validation.js';

export type SharedHookAnswers = {
  name: string;
  reactImports: string[];
};

export function sharedHookPrompts() {
  return [
    {
      type: 'input' as const,
      name: 'name',
      message: 'Hook name (e.g., WindowSize, Clipboard):',
      validate: validateName,
    },
    {
      type: 'checkbox' as const,
      name: 'reactImports',
      message: 'Which React imports?',
      choices: [
        { name: 'useState', value: 'useState', checked: true },
        { name: 'useEffect', value: 'useEffect', checked: true },
        { name: 'useCallback', value: 'useCallback' },
        { name: 'useMemo', value: 'useMemo' },
        { name: 'useRef', value: 'useRef' },
      ],
    },
  ];
}

export function sharedHookActions(
  _answers: SharedHookAnswers,
  config: RqCodegenConfig,
): GeneratorAction[] {
  return [
    {
      type: 'add',
      path: `${config.paths.sharedHooks}/use{{pascalCase name}}.ts`,
      templateFile: 'shared-hook/hook.ts.hbs',
    },
    {
      type: 'barrel-append',
      path: `${config.paths.sharedHooks}/index.ts`,
      exportLine: "export * from './use{{pascalCase name}}';",
    },
  ];
}
