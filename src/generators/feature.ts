import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { toPascalCase } from '../utils/string.js';
import { validateName } from '../utils/validation.js';

export type FeatureAnswers = {
  name: string;
  singularName: string;
  endpointKey: string;
  artifacts: string[];
  isPaginated?: boolean;
};

export function featureFields(): GeneratorField[] {
  return [
    { name: 'name', type: 'input', message: 'Feature/entity name (e.g., products):', required: true, validate: validateName },
    { name: 'singularName', type: 'input', flag: 'singular', message: 'Singular entity name for mutations (e.g., product):', required: true, validate: validateName },
    { name: 'endpointKey', type: 'input', flag: 'endpoint', message: 'ApiEndpoints key (e.g., PRODUCTS):', required: true },
    {
      name: 'artifacts', type: 'checkbox', message: 'Which artifacts to generate?',
      choices: [
        { name: 'API Handler', value: 'handler', checked: true },
        { name: 'DTO Types', value: 'types', checked: true },
        { name: 'Query Hook (list)', value: 'queryList', checked: true },
        { name: 'Query Hook (details)', value: 'queryDetails', checked: true },
        { name: 'Mutation Hook (create)', value: 'mutationCreate' },
        { name: 'Mutation Hook (update)', value: 'mutationUpdate' },
        { name: 'Mutation Hook (delete)', value: 'mutationDelete' },
        { name: 'View Component', value: 'view' },
        { name: 'Page Component', value: 'page' },
        { name: 'Validation Schema', value: 'validation' },
      ],
    },
    { name: 'isPaginated', type: 'confirm', message: 'Is the list endpoint paginated?', default: false, when: (a) => Array.isArray(a.artifacts) && (a.artifacts as string[]).includes('queryList') },
  ];
}

export function featureActions(answers: FeatureAnswers, config: RqCodegenConfig): GeneratorAction[] {
  const artifacts = answers.artifacts || [];
  const actions: GeneratorAction[] = [];
  const entityName = answers.name;
  const singularName = answers.singularName;
  const pascalSingular = toPascalCase(singularName);
  const validationSuffix = config.naming.validationSuffix;
  const validationBarrelExt = validationSuffix.replace(/\.ts$/, '');

  // 1. DTO Types (first, so handler can reference them)
  if (artifacts.includes('types')) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.types}/{{pascalCase name}}Dto.ts`,
        templateFile: 'types-dto/dto.ts.hbs',
        data: {
          includeCreateDto: artifacts.includes('mutationCreate'),
          includeUpdateDto: artifacts.includes('mutationUpdate'),
          includeParamsDto: true,
        },
      },
      {
        type: 'barrel-append',
        path: `${config.paths.types}/index.ts`,
        exportLine: "export * from './{{pascalCase name}}Dto';",
      },
    );
  }

  // 2. Handler
  if (artifacts.includes('handler')) {
    const operations: string[] = ['list', 'details'];
    if (artifacts.includes('mutationCreate')) operations.push('create');
    if (artifacts.includes('mutationUpdate')) operations.push('update');
    if (artifacts.includes('mutationDelete')) operations.push('delete');

    actions.push(
      {
        type: 'add',
        path: `${config.paths.handlers}/{{camelCase name}}.ts`,
        templateFile: 'handler/handler.ts.hbs',
        data: { operations, endpointKey: answers.endpointKey },
      },
      {
        type: 'barrel-append',
        path: `${config.paths.handlers}/index.ts`,
        exportLine: "export * from './{{camelCase name}}';",
      },
    );
  }

  // 3. Query Hooks
  if (artifacts.includes('queryList')) {
    if (answers.isPaginated) {
      actions.push(
        {
          type: 'add',
          path: `${config.paths.queries}/use{{pascalCase name}}PaginatedQuery.ts`,
          templateFile: 'query-hook/hook-paginated.ts.hbs',
          data: { hookName: `${entityName}Paginated`, handlerName: entityName, handlerKey: 'list' },
        },
        {
          type: 'barrel-append',
          path: `${config.paths.queries}/index.ts`,
          exportLine: "export * from './use{{pascalCase name}}PaginatedQuery';",
        },
      );
    } else {
      actions.push(
        {
          type: 'add',
          path: `${config.paths.queries}/use{{pascalCase name}}ListQuery.ts`,
          templateFile: 'query-hook/hook.ts.hbs',
          data: { hookName: `${entityName}List`, handlerName: entityName, handlerKey: 'list' },
        },
        {
          type: 'barrel-append',
          path: `${config.paths.queries}/index.ts`,
          exportLine: "export * from './use{{pascalCase name}}ListQuery';",
        },
      );
    }
  }

  if (artifacts.includes('queryDetails')) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.queries}/use{{pascalCase name}}DetailsQuery.ts`,
        templateFile: 'query-hook/hook-details.ts.hbs',
        data: { hookName: `${entityName}Details`, handlerName: entityName, handlerKey: 'details' },
      },
      {
        type: 'barrel-append',
        path: `${config.paths.queries}/index.ts`,
        exportLine: "export * from './use{{pascalCase name}}DetailsQuery';",
      },
    );
  }

  // 4. Mutation Hooks — use singularName for naming
  if (artifacts.includes('mutationCreate')) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.mutations}/useCreate${pascalSingular}Mutation.ts`,
        templateFile: 'mutation-hook/hook.ts.hbs',
        data: { handlerName: entityName, handlerKey: 'create', invalidateKey: 'list', mutationName: `Create${pascalSingular}` },
      },
      {
        type: 'barrel-append',
        path: `${config.paths.mutations}/index.ts`,
        exportLine: `export * from './useCreate${pascalSingular}Mutation';`,
      },
    );
  }

  if (artifacts.includes('mutationUpdate')) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.mutations}/useUpdate${pascalSingular}Mutation.ts`,
        templateFile: 'mutation-hook/hook.ts.hbs',
        data: { handlerName: entityName, handlerKey: 'update', invalidateKey: 'list', mutationName: `Update${pascalSingular}` },
      },
      {
        type: 'barrel-append',
        path: `${config.paths.mutations}/index.ts`,
        exportLine: `export * from './useUpdate${pascalSingular}Mutation';`,
      },
    );
  }

  if (artifacts.includes('mutationDelete')) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.mutations}/useDelete${pascalSingular}Mutation.ts`,
        templateFile: 'mutation-hook/hook.ts.hbs',
        data: { handlerName: entityName, handlerKey: 'remove', invalidateKey: 'list', mutationName: `Delete${pascalSingular}` },
      },
      {
        type: 'barrel-append',
        path: `${config.paths.mutations}/index.ts`,
        exportLine: `export * from './useDelete${pascalSingular}Mutation';`,
      },
    );
  }

  // 5. View
  if (artifacts.includes('view')) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.views}/{{kebabCase name}}/{{kebabCase name}}-list/{{pascalCase name}}List.tsx`,
        templateFile: 'view/View.tsx.hbs',
        data: { name: `${entityName}List` },
      },
      {
        type: 'add',
        path: `${config.paths.views}/{{kebabCase name}}/{{kebabCase name}}-list/index.ts`,
        templateFile: 'view/index.ts.hbs',
        data: { name: `${entityName}List` },
      },
      {
        type: 'barrel-append',
        path: `${config.paths.views}/{{kebabCase name}}/index.ts`,
        exportLine: "export * from './{{kebabCase name}}-list';",
      },
      {
        type: 'barrel-append',
        path: `${config.paths.views}/index.ts`,
        exportLine: "export * from './{{kebabCase name}}';",
      },
    );
  }

  // 6. Page
  if (artifacts.includes('page')) {
    const pageSuffix = config.naming.pageSuffix;
    actions.push({
      type: 'add',
      path: `${config.paths.pages}/{{kebabCase name}}/{{pascalCase name}}${pageSuffix}.tsx`,
      templateFile: 'page/Page.tsx.hbs',
      data: { pageSuffix },
    });
  }

  // 7. Validation
  if (artifacts.includes('validation')) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.validations}/{{camelCase name}}${validationSuffix}`,
        templateFile: 'validation/validation.ts.hbs',
      },
      {
        type: 'barrel-append',
        path: `${config.paths.validations}/index.ts`,
        exportLine: `export * from './{{camelCase name}}${validationBarrelExt}';`,
      },
    );
  }

  return actions;
}
