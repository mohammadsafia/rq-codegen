import { z } from 'zod';

const hookImportSchema = z.object({
  import: z.string(),
  from: z.string(),
});

export const configSchema = z.object({
  srcDir: z.string().optional(),

  aliases: z
    .object({
      api: z.string().optional(),
      components: z.string().optional(),
      hooks: z.string().optional(),
      types: z.string().optional(),
      utils: z.string().optional(),
      contexts: z.string().optional(),
      constants: z.string().optional(),
      views: z.string().optional(),
      pages: z.string().optional(),
      validations: z.string().optional(),
      assets: z.string().optional(),
      routes: z.string().optional(),
      hoc: z.string().optional(),
      appConfig: z.string().optional(),
    })
    .optional(),

  features: z
    .object({
      i18n: z.boolean().optional(),
      toast: z.boolean().optional(),
      barrel: z.boolean().optional(),
      routeRegistration: z.boolean().optional(),
    })
    .optional(),

  naming: z
    .object({
      dtoSuffixes: z
        .object({
          read: z.string().optional(),
          create: z.string().optional(),
          update: z.string().optional(),
          list: z.string().optional(),
          listResponse: z.string().optional(),
          params: z.string().optional(),
        })
        .optional(),
      validationSuffix: z.string().optional(),
      pageSuffix: z.string().optional(),
      hookPrefix: z.string().optional(),
    })
    .optional(),

  paths: z
    .object({
      handlers: z.string().optional(),
      apiConfig: z.string().optional(),
      types: z.string().optional(),
      queries: z.string().optional(),
      mutations: z.string().optional(),
      sharedHooks: z.string().optional(),
      hookUtils: z.string().optional(),
      uiComponents: z.string().optional(),
      sharedComponents: z.string().optional(),
      formComponents: z.string().optional(),
      pages: z.string().optional(),
      views: z.string().optional(),
      validations: z.string().optional(),
    })
    .optional(),

  router: z
    .object({
      routerFile: z.string().optional(),
      routesFile: z.string().optional(),
      layouts: z.array(z.string()).optional(),
    })
    .optional(),

  hooks: z
    .object({
      toast: hookImportSchema.optional(),
      translation: hookImportSchema.optional(),
      paginatedQuery: hookImportSchema.optional(),
    })
    .optional(),

  templatesDir: z.string().optional(),
});

export type PartialRqCodegenConfig = z.infer<typeof configSchema>;
