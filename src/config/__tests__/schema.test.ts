import { describe, it, expect } from 'vitest';

import { configSchema } from '../schema.js';

describe('configSchema', () => {
  it('accepts empty config (all optional)', () => {
    const result = configSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts valid partial config', () => {
    const result = configSchema.safeParse({
      srcDir: './app',
      features: { i18n: true },
    });
    expect(result.success).toBe(true);
  });

  it('accepts full config', () => {
    const result = configSchema.safeParse({
      srcDir: './src',
      aliases: {
        api: '@api',
        components: '@components',
        hooks: '@hooks',
        types: '@app-types',
        utils: '@utils',
        contexts: '@contexts',
        constants: '@constants',
        views: '@views',
        pages: '@pages',
        validations: '@validations',
        assets: '@assets',
        routes: '@routes',
        hoc: '@hoc',
        appConfig: '@app-config',
      },
      features: {
        i18n: true,
        toast: true,
        barrel: true,
        routeRegistration: true,
      },
      naming: {
        dtoSuffixes: {
          read: 'ForReadDto',
          create: 'ForCreateDto',
          update: 'ForUpdateDto',
          list: 'ListDto',
          listResponse: 'ListResponseDto',
          params: 'ParamsDto',
        },
        validationSuffix: '.schema.ts',
        pageSuffix: 'Page',
      },
      paths: {
        handlers: 'api/handlers',
        apiConfig: 'api/config',
        types: 'types/api',
        queries: 'lib/hooks/queries',
        mutations: 'lib/hooks/mutations',
        sharedHooks: 'lib/hooks/shared',
        hookUtils: 'lib/hooks/utils',
        uiComponents: 'components/ui',
        sharedComponents: 'components/shared',
        formComponents: 'components/forms',
        pages: 'pages',
        views: 'views',
        validations: 'validations',
      },
      router: {
        routerFile: 'routes/router.tsx',
        routesFile: 'routes/routes.ts',
        layouts: ['MainLayout', 'DashboardLayout'],
      },
      hooks: {
        toast: { import: 'useToast', from: '@hooks/shared' },
        translation: { import: 'useAppTranslation', from: '@hooks/shared' },
        paginatedQuery: { import: 'usePaginatedDataTableQuery', from: '@hooks/utils' },
      },
      templatesDir: './templates',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid srcDir type', () => {
    const result = configSchema.safeParse({
      srcDir: 123,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid features type', () => {
    const result = configSchema.safeParse({
      features: { i18n: 'yes' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts partial features', () => {
    const result = configSchema.safeParse({
      features: { i18n: true },
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial aliases', () => {
    const result = configSchema.safeParse({
      aliases: { api: '@my-api' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial naming', () => {
    const result = configSchema.safeParse({
      naming: {
        dtoSuffixes: { read: 'Dto' },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial paths', () => {
    const result = configSchema.safeParse({
      paths: { handlers: 'custom/handlers' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial router', () => {
    const result = configSchema.safeParse({
      router: { layouts: ['CustomLayout'] },
    });
    expect(result.success).toBe(true);
  });

  it('accepts partial hooks', () => {
    const result = configSchema.safeParse({
      hooks: {
        toast: { import: 'useCustomToast', from: '@custom/hooks' },
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid hooks structure', () => {
    const result = configSchema.safeParse({
      hooks: {
        toast: 'invalid',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-object config', () => {
    const result = configSchema.safeParse('not-an-object');
    expect(result.success).toBe(false);
  });

  it('rejects invalid layouts type', () => {
    const result = configSchema.safeParse({
      router: { layouts: 'not-an-array' },
    });
    expect(result.success).toBe(false);
  });
});
