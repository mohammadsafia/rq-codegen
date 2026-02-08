import { describe, it, expect } from 'vitest';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { registerHelpers } from '../helpers.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';
import type { RqCodegenConfig } from '../../config/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../../../templates');

let hbs: typeof Handlebars;

function createConfig(overrides: Partial<RqCodegenConfig> = {}): RqCodegenConfig {
  return { ...DEFAULT_CONFIG, ...overrides } as RqCodegenConfig;
}

function renderTemplate(
  templateRelPath: string,
  data: Record<string, unknown>,
  config: RqCodegenConfig = DEFAULT_CONFIG,
): string {
  hbs = Handlebars.create();
  registerHelpers(hbs, config);

  const templatePath = path.join(TEMPLATES_DIR, templateRelPath);
  const content = fs.readFileSync(templatePath, 'utf-8');
  return hbs.compile(content)({ ...data, config });
}

describe('Component UI template', () => {
  it('renders component with correct name', () => {
    const result = renderTemplate('component-ui/Component.tsx.hbs', {
      name: 'StatusIndicator',
    });
    expect(result).toContain('StatusIndicator');
  });

  it('includes CVA import', () => {
    const result = renderTemplate('component-ui/Component.tsx.hbs', {
      name: 'StatusIndicator',
    });
    expect(result).toContain('cva');
  });

  it('uses config alias for imports', () => {
    const result = renderTemplate('component-ui/Component.tsx.hbs', {
      name: 'StatusIndicator',
    });
    expect(result).toContain('@');
  });
});

describe('Component UI index template', () => {
  it('exports component', () => {
    const result = renderTemplate('component-ui/index.ts.hbs', {
      name: 'StatusIndicator',
    });
    expect(result).toContain('StatusIndicator');
    expect(result).toContain('export');
  });
});

describe('Handler template', () => {
  const handlerData = {
    name: 'Community',
    singularName: 'community',
    endpointKey: 'COMMUNITY',
    operations: ['list', 'details', 'create', 'update', 'delete'],
  };

  it('imports from configured API alias', () => {
    const result = renderTemplate('handler/handler.ts.hbs', handlerData);
    expect(result).toContain("from '@api/config'");
  });

  it('imports from configured types alias', () => {
    const result = renderTemplate('handler/handler.ts.hbs', handlerData);
    expect(result).toContain("from '@app-types'");
  });

  it('uses DTO suffixes from config', () => {
    const result = renderTemplate('handler/handler.ts.hbs', handlerData);
    expect(result).toContain('CommunityForReadDto');
    expect(result).toContain('CommunityForCreateDto');
    expect(result).toContain('CommunityForUpdateDto');
    expect(result).toContain('CommunityListResponseDto');
  });

  it('generates CONSTANT_CASE for endpoint key', () => {
    const result = renderTemplate('handler/handler.ts.hbs', handlerData);
    expect(result).toContain('COMMUNITY');
  });

  it('includes queryKey for list operation', () => {
    const result = renderTemplate('handler/handler.ts.hbs', handlerData);
    expect(result).toContain("queryKey: 'community/list'");
  });

  it('includes queryKey for details operation', () => {
    const result = renderTemplate('handler/handler.ts.hbs', handlerData);
    expect(result).toContain("queryKey: 'community/details'");
  });

  it('includes mutationKey for create operation', () => {
    const result = renderTemplate('handler/handler.ts.hbs', handlerData);
    expect(result).toContain("mutationKey: 'community/create'");
  });

  it('omits create when not in operations', () => {
    const result = renderTemplate('handler/handler.ts.hbs', {
      ...handlerData,
      operations: ['list', 'details'],
    });
    expect(result).not.toContain('ForCreateDto');
    expect(result).not.toContain('mutationKey');
  });

  it('uses custom aliases', () => {
    const config = createConfig({
      aliases: {
        ...DEFAULT_CONFIG.aliases,
        api: '@custom-api',
        types: '@my-types',
      },
    });
    const result = renderTemplate('handler/handler.ts.hbs', handlerData, config);
    expect(result).toContain("from '@custom-api/config'");
    expect(result).toContain("from '@my-types'");
  });

  it('uses custom DTO suffixes', () => {
    const config = createConfig({
      naming: {
        ...DEFAULT_CONFIG.naming,
        dtoSuffixes: {
          ...DEFAULT_CONFIG.naming.dtoSuffixes,
          read: 'ReadDto',
          create: 'CreateDto',
        },
      },
    });
    const result = renderTemplate('handler/handler.ts.hbs', handlerData, config);
    expect(result).toContain('CommunityReadDto');
    expect(result).toContain('CommunityCreateDto');
  });
});

describe('Validation template', () => {
  it('renders with i18n enabled', () => {
    const config = createConfig({
      features: { ...DEFAULT_CONFIG.features, i18n: true },
    });
    const result = renderTemplate('validation/validation.ts.hbs', { name: 'Community' }, config);

    expect(result).toContain('TFunction');
    expect(result).toContain('communitySchema');
    expect(result).toContain("from 'zod'");
  });

  it('renders without i18n', () => {
    const config = createConfig({
      features: { ...DEFAULT_CONFIG.features, i18n: false },
    });
    const result = renderTemplate('validation/validation.ts.hbs', { name: 'Community' }, config);

    expect(result).not.toContain('TFunction');
    expect(result).toContain('communitySchema');
    expect(result).toContain("from 'zod'");
  });

  it('uses camelCase for schema name', () => {
    const result = renderTemplate('validation/validation.ts.hbs', {
      name: 'UserProfile',
    });
    expect(result).toContain('userProfileSchema');
  });

  it('uses PascalCase for type name', () => {
    const result = renderTemplate('validation/validation.ts.hbs', {
      name: 'UserProfile',
    });
    expect(result).toContain('UserProfileFormData');
  });
});

describe('Mutation hook template', () => {
  const mutData = {
    handlerName: 'Community',
    handlerKey: 'create',
    invalidateKey: 'list',
    mutationName: 'CreateCommunity',
  };

  it('renders with toast and i18n enabled', () => {
    const config = createConfig({
      features: { ...DEFAULT_CONFIG.features, toast: true, i18n: true },
    });
    const result = renderTemplate('mutation-hook/hook.ts.hbs', mutData, config);

    expect(result).toContain('useToast');
    expect(result).toContain('useAppTranslation');
    expect(result).toContain('useMutation');
    expect(result).toContain('useCreateCommunityMutation');
  });

  it('renders without toast and i18n', () => {
    const config = createConfig({
      features: { ...DEFAULT_CONFIG.features, toast: false, i18n: false },
    });
    const result = renderTemplate('mutation-hook/hook.ts.hbs', mutData, config);

    expect(result).not.toContain('useToast');
    expect(result).not.toContain('useAppTranslation');
    expect(result).toContain('useMutation');
  });

  it('uses custom hook imports', () => {
    const config = createConfig({
      features: { ...DEFAULT_CONFIG.features, toast: true, i18n: true },
      hooks: {
        ...DEFAULT_CONFIG.hooks,
        toast: { import: 'useCustomToast', from: '@custom/hooks' },
        translation: { import: 'useI18n', from: '@custom/i18n' },
      },
    });
    const result = renderTemplate('mutation-hook/hook.ts.hbs', mutData, config);

    expect(result).toContain('useCustomToast');
    expect(result).toContain("from '@custom/hooks'");
    expect(result).toContain('useI18n');
    expect(result).toContain("from '@custom/i18n'");
  });
});

describe('Query hook template', () => {
  it('renders list query', () => {
    const result = renderTemplate('query-hook/hook.ts.hbs', {
      name: 'Community',
      singularName: 'community',
      handlerName: 'Community',
      hookName: 'CommunityList',
      handlerKey: 'list',
    });

    expect(result).toContain('useQuery');
    expect(result).toContain('CommunityHandler');
    expect(result).toContain('useCommunityListQuery');
  });

  it('renders details query', () => {
    const result = renderTemplate('query-hook/hook-details.ts.hbs', {
      handlerName: 'Community',
      hookName: 'CommunityDetails',
      handlerKey: 'details',
    });

    expect(result).toContain('useQuery');
    expect(result).toContain('CommunityHandler');
    expect(result).toContain('useCommunityDetailsQuery');
  });

  it('renders paginated query', () => {
    const config = createConfig();
    const result = renderTemplate('query-hook/hook-paginated.ts.hbs', {
      handlerName: 'Community',
      hookName: 'CommunityPaginated',
      handlerKey: 'list',
    }, config);

    expect(result).toContain('usePaginatedDataTableQuery');
    expect(result).toContain('CommunityHandler');
  });

  it('uses custom paginated query hook', () => {
    const config = createConfig({
      hooks: {
        ...DEFAULT_CONFIG.hooks,
        paginatedQuery: { import: 'useCustomPagination', from: '@custom/pagination' },
      },
    });
    const result = renderTemplate('query-hook/hook-paginated.ts.hbs', {
      handlerName: 'Community',
      hookName: 'CommunityPaginated',
      handlerKey: 'list',
    }, config);

    expect(result).toContain('useCustomPagination');
    expect(result).toContain("from '@custom/pagination'");
  });
});

describe('Page template', () => {
  it('renders page component', () => {
    const result = renderTemplate('page/Page.tsx.hbs', {
      name: 'Communities',
    });

    expect(result).toContain('Communities');
  });
});

describe('View template', () => {
  it('renders view component', () => {
    const result = renderTemplate('view/View.tsx.hbs', {
      name: 'CommunityCard',
    });

    expect(result).toContain('CommunityCard');
  });
});

describe('Shared hook template', () => {
  it('renders with use prefix', () => {
    const result = renderTemplate('shared-hook/hook.ts.hbs', {
      name: 'Debounce',
    });

    expect(result).toContain('useDebounce');
  });
});

describe('Component shared template', () => {
  it('renders shared component', () => {
    const result = renderTemplate('component-shared/Component.tsx.hbs', {
      name: 'DataCard',
    });

    expect(result).toContain('DataCard');
  });
});

describe('Component form template', () => {
  it('renders form component', () => {
    const result = renderTemplate('component-form/FormComponent.tsx.hbs', {
      name: 'UserProfile',
    });

    expect(result).toContain('UserProfile');
  });
});

describe('Types DTO template', () => {
  it('renders DTO types', () => {
    const result = renderTemplate('types-dto/dto.ts.hbs', {
      name: 'Community',
      includeCreateDto: true,
      includeUpdateDto: true,
      includeParamsDto: true,
    });

    expect(result).toContain('CommunityForReadDto');
    expect(result).toContain('export type');
  });

  it('uses custom DTO suffixes', () => {
    const config = createConfig({
      naming: {
        ...DEFAULT_CONFIG.naming,
        dtoSuffixes: {
          ...DEFAULT_CONFIG.naming.dtoSuffixes,
          read: 'ReadDto',
        },
      },
    });
    const result = renderTemplate('types-dto/dto.ts.hbs', {
      name: 'Community',
      includeCreateDto: true,
      includeUpdateDto: true,
      includeParamsDto: true,
    }, config);

    expect(result).toContain('CommunityReadDto');
  });
});
