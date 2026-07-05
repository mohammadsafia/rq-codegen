import type { RqCodegenConfig } from '../config/types.js';
import type { GeneratorAction } from '../core/engine.js';
import type { GeneratorField } from '../core/fields.js';
import { toPascalCase } from '../utils/string.js';
import { validateName } from '../utils/validation.js';

export type HandlerAnswers = {
  name: string;
  singularName: string;
  endpointKey: string;
  apiBaseUrl: string;
  operations: string[];
  chainTypes: boolean;
  chainQueryHook: boolean;
  isPaginated?: boolean;
  chainMutationHook: boolean;
};

export function handlerFields(): GeneratorField[] {
  return [
    { name: 'name', type: 'input', message: 'Entity name (e.g., products):', required: true, validate: validateName },
    { name: 'singularName', type: 'input', flag: 'singular', message: 'Singular entity name for mutations (e.g., product):', required: true, validate: validateName },
    { name: 'endpointKey', type: 'input', flag: 'endpoint', message: 'ApiEndpoints key (e.g., PRODUCTS):', required: true },
    {
      name: 'apiBaseUrl', type: 'input', flag: 'base-url',
      message: 'API base URL (e.g., /o/headless-marketplace/v1.0/products):',
      required: true,
      validate: (input: string) => (input && input.trim().length > 0 ? true : 'API base URL is required'),
    },
    {
      name: 'operations', type: 'checkbox', message: 'Which operations?',
      choices: [
        { name: 'list', value: 'list', checked: true },
        { name: 'details', value: 'details', checked: true },
        { name: 'create', value: 'create' },
        { name: 'update', value: 'update' },
        { name: 'delete', value: 'delete' },
      ],
    },
    { name: 'chainTypes', type: 'confirm', message: 'Also generate DTO types?', default: true },
    { name: 'chainQueryHook', type: 'confirm', message: 'Also generate query hook(s)?', default: true },
    { name: 'isPaginated', type: 'confirm', message: 'Is the list endpoint paginated?', default: false, when: (a) => !!a.chainQueryHook && Array.isArray(a.operations) && (a.operations as string[]).includes('list') },
    { name: 'chainMutationHook', type: 'confirm', message: 'Also generate mutation hook(s)?', default: true },
  ];
}

export function handlerActions(answers: HandlerAnswers, config: RqCodegenConfig): GeneratorAction[] {
  const operations = answers.operations || [];
  const entityName = answers.name;
  const singularName = answers.singularName;
  const pascalSingular = toPascalCase(singularName);

  const actions: GeneratorAction[] = [
    {
      type: 'endpoint-register',
      data: {
        endpointKey: answers.endpointKey,
        apiBaseUrl: answers.apiBaseUrl,
        operations,
      },
    },
    {
      type: 'add',
      path: `${config.paths.handlers}/{{camelCase name}}.ts`,
      templateFile: 'handler/handler.ts.hbs',
      data: { operations },
    },
    {
      type: 'barrel-append',
      path: `${config.paths.handlers}/index.ts`,
      exportLine: "export * from './{{camelCase name}}';",
    },
  ];

  // Chain DTO types
  if (answers.chainTypes) {
    actions.push(
      {
        type: 'add',
        path: `${config.paths.types}/{{pascalCase name}}Dto.ts`,
        templateFile: 'types-dto/dto.ts.hbs',
        data: {
          includeCreateDto: operations.includes('create'),
          includeUpdateDto: operations.includes('update'),
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

  // Chain query hooks
  if (answers.chainQueryHook && operations.includes('list')) {
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

  if (answers.chainQueryHook && operations.includes('details')) {
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

  // Chain mutation hooks — use singularName for naming
  if (answers.chainMutationHook && operations.includes('create')) {
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

  if (answers.chainMutationHook && operations.includes('update')) {
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

  if (answers.chainMutationHook && operations.includes('delete')) {
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

  return actions;
}
