import type { RqCodegenConfig } from './types.js';

export const DEFAULT_CONFIG: RqCodegenConfig = {
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
    routeRegistration: false,
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
    hookPrefix: 'use',
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
};
