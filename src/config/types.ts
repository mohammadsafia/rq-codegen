export type AliasConfig = {
  api: string;
  components: string;
  hooks: string;
  types: string;
  utils: string;
  contexts: string;
  constants: string;
  views: string;
  pages: string;
  validations: string;
  assets: string;
  routes: string;
  hoc: string;
  appConfig: string;
};

export type FeatureToggles = {
  i18n: boolean;
  toast: boolean;
  barrel: boolean;
  routeRegistration: boolean;
};

export type DtoSuffixes = {
  read: string;
  create: string;
  update: string;
  list: string;
  listResponse: string;
  params: string;
};

export type NamingConfig = {
  dtoSuffixes: DtoSuffixes;
  validationSuffix: string;
  pageSuffix: string;
  hookPrefix: string;
};

export type PathsConfig = {
  handlers: string;
  apiConfig: string;
  types: string;
  queries: string;
  mutations: string;
  sharedHooks: string;
  hookUtils: string;
  uiComponents: string;
  sharedComponents: string;
  formComponents: string;
  pages: string;
  views: string;
  validations: string;
};

export type HookImportConfig = {
  import: string;
  from: string;
};

export type HooksConfig = {
  toast: HookImportConfig;
  translation: HookImportConfig;
  paginatedQuery: HookImportConfig;
};

export type RouterConfig = {
  routerFile: string;
  routesFile: string;
  layouts: string[];
};

export type RqCodegenConfig = {
  srcDir: string;
  aliases: AliasConfig;
  features: FeatureToggles;
  naming: NamingConfig;
  paths: PathsConfig;
  router: RouterConfig;
  hooks: HooksConfig;
  templatesDir?: string;
};
