import { describe, it, expect } from 'vitest';

import { pageFields, pageActions, preprocessPageAnswers, type PageAnswers } from '../page.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';

describe('pageFields', () => {
  it('returns fields array', () => {
    const fields = pageFields(DEFAULT_CONFIG);
    expect(Array.isArray(fields)).toBe(true);
    expect(fields.length).toBeGreaterThanOrEqual(2);
  });

  it('has name field', () => {
    const fields = pageFields(DEFAULT_CONFIG);
    expect(fields.find((f) => f.name === 'name')).toBeDefined();
  });

  it('has category field', () => {
    const fields = pageFields(DEFAULT_CONFIG);
    expect(fields.find((f) => f.name === 'category')).toBeDefined();
  });

  it('includes route fields when routeRegistration is enabled', () => {
    const config = {
      ...DEFAULT_CONFIG,
      features: { ...DEFAULT_CONFIG.features, routeRegistration: true },
    };
    const fields = pageFields(config);
    expect(fields.find((f) => f.name === 'registerRoute')).toBeDefined();
  });

  it('excludes route fields when routeRegistration is disabled', () => {
    const config = {
      ...DEFAULT_CONFIG,
      features: { ...DEFAULT_CONFIG.features, routeRegistration: false },
    };
    const fields = pageFields(config);
    expect(fields.find((f) => f.name === 'registerRoute')).toBeUndefined();
  });
});

describe('preprocessPageAnswers', () => {
  it('uses newCategory when provided', () => {
    const answers: PageAnswers = {
      name: 'Dashboard',
      category: 'Create new category',
      newCategory: 'admin',
    };
    const result = preprocessPageAnswers(answers);
    expect(result.category).toBe('admin');
  });

  it('keeps category when no newCategory', () => {
    const answers: PageAnswers = {
      name: 'Dashboard',
      category: 'settings',
    };
    const result = preprocessPageAnswers(answers);
    expect(result.category).toBe('settings');
  });
});

describe('pageActions', () => {
  it('creates page file', () => {
    const actions = pageActions(
      { name: 'Dashboard', category: 'admin' },
      DEFAULT_CONFIG,
    );

    const addAction = actions.find((a) => a.type === 'add');
    expect(addAction).toBeDefined();
    if (addAction?.type === 'add') {
      expect(addAction.path).toContain('{{kebabCase category}}');
      expect(addAction.path).toContain('Page');
      expect(addAction.templateFile).toBe('page/Page.tsx.hbs');
    }
  });

  it('uses config page suffix', () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      naming: { ...DEFAULT_CONFIG.naming, pageSuffix: 'View' },
    };
    const actions = pageActions(
      { name: 'Dashboard', category: 'admin' },
      customConfig,
    );

    const addAction = actions.find((a) => a.type === 'add');
    if (addAction?.type === 'add') {
      expect(addAction.path).toContain('View.tsx');
    }
  });

  it('adds route-register action when route registration enabled and registerRoute true', () => {
    const config = {
      ...DEFAULT_CONFIG,
      features: { ...DEFAULT_CONFIG.features, routeRegistration: true },
    };

    const actions = pageActions(
      {
        name: 'Dashboard',
        category: 'admin',
        registerRoute: true,
        layout: 'DashboardLayout',
        isProtected: true,
        routePath: '/admin/dashboard',
      },
      config,
    );

    const routeAction = actions.find((a) => a.type === 'route-register');
    expect(routeAction).toBeDefined();
    if (routeAction?.type === 'route-register') {
      expect(routeAction.data.pageName).toBe('Dashboard');
      expect(routeAction.data.category).toBe('admin');
      expect(routeAction.data.layout).toBe('DashboardLayout');
      expect(routeAction.data.isProtected).toBe(true);
      expect(routeAction.data.routePath).toBe('/admin/dashboard');
    }
  });

  it('does not add route-register when routeRegistration disabled', () => {
    const config = {
      ...DEFAULT_CONFIG,
      features: { ...DEFAULT_CONFIG.features, routeRegistration: false },
    };

    const actions = pageActions(
      { name: 'Dashboard', category: 'admin', registerRoute: true },
      config,
    );

    const routeAction = actions.find((a) => a.type === 'route-register');
    expect(routeAction).toBeUndefined();
  });

  it('does not add route-register when registerRoute is false', () => {
    const config = {
      ...DEFAULT_CONFIG,
      features: { ...DEFAULT_CONFIG.features, routeRegistration: true },
    };

    const actions = pageActions(
      { name: 'Dashboard', category: 'admin', registerRoute: false },
      config,
    );

    const routeAction = actions.find((a) => a.type === 'route-register');
    expect(routeAction).toBeUndefined();
  });
});
