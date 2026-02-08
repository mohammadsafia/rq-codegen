import { describe, it, expect } from 'vitest';

import { DEFAULT_CONFIG } from '../defaults.js';

describe('DEFAULT_CONFIG', () => {
  it('has srcDir set to ./src', () => {
    expect(DEFAULT_CONFIG.srcDir).toBe('./src');
  });

  describe('aliases', () => {
    it('has all required alias keys', () => {
      const expectedKeys = [
        'api', 'components', 'hooks', 'types', 'utils',
        'contexts', 'constants', 'views', 'pages',
        'validations', 'assets', 'routes', 'hoc', 'appConfig',
      ];
      for (const key of expectedKeys) {
        expect(DEFAULT_CONFIG.aliases).toHaveProperty(key);
      }
    });

    it('all aliases start with @', () => {
      for (const value of Object.values(DEFAULT_CONFIG.aliases)) {
        expect(value).toMatch(/^@/);
      }
    });

    it('has correct default aliases', () => {
      expect(DEFAULT_CONFIG.aliases.api).toBe('@api');
      expect(DEFAULT_CONFIG.aliases.types).toBe('@app-types');
      expect(DEFAULT_CONFIG.aliases.appConfig).toBe('@app-config');
    });
  });

  describe('features', () => {
    it('has all feature toggle keys', () => {
      expect(DEFAULT_CONFIG.features).toHaveProperty('i18n');
      expect(DEFAULT_CONFIG.features).toHaveProperty('toast');
      expect(DEFAULT_CONFIG.features).toHaveProperty('barrel');
      expect(DEFAULT_CONFIG.features).toHaveProperty('routeRegistration');
    });

    it('has barrel enabled by default', () => {
      expect(DEFAULT_CONFIG.features.barrel).toBe(true);
    });

    it('has all features as booleans', () => {
      for (const value of Object.values(DEFAULT_CONFIG.features)) {
        expect(typeof value).toBe('boolean');
      }
    });
  });

  describe('naming', () => {
    it('has correct DTO suffixes', () => {
      expect(DEFAULT_CONFIG.naming.dtoSuffixes.read).toBe('ForReadDto');
      expect(DEFAULT_CONFIG.naming.dtoSuffixes.create).toBe('ForCreateDto');
      expect(DEFAULT_CONFIG.naming.dtoSuffixes.update).toBe('ForUpdateDto');
      expect(DEFAULT_CONFIG.naming.dtoSuffixes.list).toBe('ListDto');
      expect(DEFAULT_CONFIG.naming.dtoSuffixes.listResponse).toBe('ListResponseDto');
      expect(DEFAULT_CONFIG.naming.dtoSuffixes.params).toBe('ParamsDto');
    });

    it('has validation suffix as .schema.ts', () => {
      expect(DEFAULT_CONFIG.naming.validationSuffix).toBe('.schema.ts');
    });

    it('has page suffix', () => {
      expect(DEFAULT_CONFIG.naming.pageSuffix).toBe('Page');
    });
  });

  describe('paths', () => {
    it('has all required path keys', () => {
      const expectedKeys = [
        'handlers', 'apiConfig', 'types', 'queries', 'mutations',
        'sharedHooks', 'hookUtils', 'uiComponents', 'sharedComponents',
        'formComponents', 'pages', 'views', 'validations',
      ];
      for (const key of expectedKeys) {
        expect(DEFAULT_CONFIG.paths).toHaveProperty(key);
      }
    });

    it('all paths are non-empty strings', () => {
      for (const value of Object.values(DEFAULT_CONFIG.paths)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });

  describe('router', () => {
    it('has routerFile and routesFile', () => {
      expect(DEFAULT_CONFIG.router.routerFile).toBeDefined();
      expect(DEFAULT_CONFIG.router.routesFile).toBeDefined();
    });

    it('has layouts array', () => {
      expect(Array.isArray(DEFAULT_CONFIG.router.layouts)).toBe(true);
      expect(DEFAULT_CONFIG.router.layouts.length).toBeGreaterThan(0);
    });
  });

  describe('hooks', () => {
    it('has toast hook config', () => {
      expect(DEFAULT_CONFIG.hooks.toast.import).toBeDefined();
      expect(DEFAULT_CONFIG.hooks.toast.from).toBeDefined();
    });

    it('has translation hook config', () => {
      expect(DEFAULT_CONFIG.hooks.translation.import).toBeDefined();
      expect(DEFAULT_CONFIG.hooks.translation.from).toBeDefined();
    });

    it('has paginatedQuery hook config', () => {
      expect(DEFAULT_CONFIG.hooks.paginatedQuery.import).toBeDefined();
      expect(DEFAULT_CONFIG.hooks.paginatedQuery.from).toBeDefined();
    });
  });

  it('does not have templatesDir by default', () => {
    expect(DEFAULT_CONFIG.templatesDir).toBeUndefined();
  });
});
