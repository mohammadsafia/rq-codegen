import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { barrelAppend, routeRegister } from '../actions.js';
import { DEFAULT_CONFIG } from '../../config/defaults.js';
import type { RqCodegenConfig } from '../../config/types.js';

const TEST_DIR = path.join(os.tmpdir(), 'rq-codegen-actions-test');

let config: RqCodegenConfig;

beforeEach(() => {
  config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  config.srcDir = '.';
  fs.mkdirSync(TEST_DIR, { recursive: true });
  vi.spyOn(process, 'cwd').mockReturnValue(TEST_DIR);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('barrelAppend', () => {
  it('creates barrel file if it does not exist', () => {
    const result = barrelAppend(
      'components/index.ts',
      "export * from './Button';",
      config,
      {},
    );

    expect(result.type).toBe('updated');
    const content = fs.readFileSync(path.join(TEST_DIR, 'components/index.ts'), 'utf-8');
    expect(content).toContain("export * from './Button'");
  });

  it('appends to existing barrel file', () => {
    const barrelPath = path.join(TEST_DIR, 'components');
    fs.mkdirSync(barrelPath, { recursive: true });
    fs.writeFileSync(path.join(barrelPath, 'index.ts'), "export * from './Input';\n");

    const result = barrelAppend(
      'components/index.ts',
      "export * from './Button';",
      config,
      {},
    );

    expect(result.type).toBe('updated');
    const content = fs.readFileSync(path.join(barrelPath, 'index.ts'), 'utf-8');
    expect(content).toContain("export * from './Input'");
    expect(content).toContain("export * from './Button'");
  });

  it('skips if export already exists', () => {
    const barrelPath = path.join(TEST_DIR, 'components');
    fs.mkdirSync(barrelPath, { recursive: true });
    fs.writeFileSync(
      path.join(barrelPath, 'index.ts'),
      "export * from './Button';\n",
    );

    const result = barrelAppend(
      'components/index.ts',
      "export * from './Button';",
      config,
      {},
    );

    expect(result.type).toBe('skipped');
    expect(result.message).toContain('already exists');
  });

  it('skips if barrel feature is disabled', () => {
    config.features.barrel = false;

    const result = barrelAppend(
      'components/index.ts',
      "export * from './Button';",
      config,
      {},
    );

    expect(result.type).toBe('skipped');
    expect(result.message).toContain('disabled');
  });

  it('renders template variables in export line', () => {
    const result = barrelAppend(
      'components/index.ts',
      "export * from './{{kebabCase name}}';",
      config,
      { name: 'StatusIndicator' },
    );

    expect(result.type).toBe('updated');
    const content = fs.readFileSync(
      path.join(TEST_DIR, 'components/index.ts'),
      'utf-8',
    );
    expect(content).toContain("export * from './status-indicator'");
  });

  it('renders template variables in path', () => {
    const result = barrelAppend(
      '{{kebabCase name}}/index.ts',
      "export * from './Component';",
      config,
      { name: 'StatusIndicator' },
    );

    expect(result.type).toBe('updated');
    expect(
      fs.existsSync(path.join(TEST_DIR, 'status-indicator/index.ts')),
    ).toBe(true);
  });

  it('trims trailing whitespace before appending', () => {
    const barrelPath = path.join(TEST_DIR, 'components');
    fs.mkdirSync(barrelPath, { recursive: true });
    fs.writeFileSync(
      path.join(barrelPath, 'index.ts'),
      "export * from './Input';\n\n\n",
    );

    barrelAppend(
      'components/index.ts',
      "export * from './Button';",
      config,
      {},
    );

    const content = fs.readFileSync(path.join(barrelPath, 'index.ts'), 'utf-8');
    expect(content).toBe("export * from './Input';\nexport * from './Button';\n");
  });
});

describe('routeRegister', () => {
  const routerContent = `import { lazy } from 'react';

const HomePage = lazy(() => import('@pages/home/HomePage'));
const AboutPage = lazy(() => import('@pages/about/AboutPage'));

export const router = [
  { path: '/', element: <HomePage /> },
];`;

  const routesContent = `export const FULL_ROUTES_PATH = {
  HOME: {
    INDEX: '/',
  },
} as const;`;

  beforeEach(() => {
    config.router.routerFile = 'routes/router.tsx';
    config.router.routesFile = 'routes/routes.ts';

    const routerDir = path.join(TEST_DIR, 'routes');
    fs.mkdirSync(routerDir, { recursive: true });
    fs.writeFileSync(path.join(routerDir, 'router.tsx'), routerContent);
    fs.writeFileSync(path.join(routerDir, 'routes.ts'), routesContent);
  });

  it('adds lazy import to router file', () => {
    const results = routeRegister(config, {
      pageName: 'UserProfile',
      category: 'users',
      layout: 'DashboardLayout',
      isProtected: true,
      routePath: '/users/profile',
    });

    const updatedRouter = fs.readFileSync(
      path.join(TEST_DIR, 'routes/router.tsx'),
      'utf-8',
    );

    expect(updatedRouter).toContain("const UserProfilePage = lazy(() => import('@pages/users/UserProfilePage'))");
    const routerResult = results.find((r) => r.path.includes('router.tsx'));
    expect(routerResult?.type).toBe('updated');
  });

  it('adds route constant to routes file', () => {
    const results = routeRegister(config, {
      pageName: 'UserProfile',
      category: 'users',
      layout: 'DashboardLayout',
      isProtected: true,
      routePath: '/users/profile',
    });

    const updatedRoutes = fs.readFileSync(
      path.join(TEST_DIR, 'routes/routes.ts'),
      'utf-8',
    );

    expect(updatedRoutes).toContain('USERS');
    expect(updatedRoutes).toContain("USER_PROFILE: '/users/profile'");
    const routeResult = results.find((r) => r.path.includes('routes.ts'));
    expect(routeResult?.type).toBe('updated');
  });

  it('adds to existing category in routes file', () => {
    const routesWithCategory = `export const FULL_ROUTES_PATH = {
  USERS: {
    INDEX: '/users',
  },
} as const;`;
    fs.writeFileSync(path.join(TEST_DIR, 'routes/routes.ts'), routesWithCategory);

    routeRegister(config, {
      pageName: 'UserProfile',
      category: 'users',
      layout: 'DashboardLayout',
      isProtected: true,
      routePath: '/users/profile',
    });

    const updatedRoutes = fs.readFileSync(
      path.join(TEST_DIR, 'routes/routes.ts'),
      'utf-8',
    );

    expect(updatedRoutes).toContain("INDEX: '/users'");
    expect(updatedRoutes).toContain("USER_PROFILE: '/users/profile'");
  });

  it('skips if lazy import already exists', () => {
    const routerWithImport = routerContent + `\nconst UserProfilePage = lazy(() => import('@pages/users/UserProfilePage'));`;
    fs.writeFileSync(path.join(TEST_DIR, 'routes/router.tsx'), routerWithImport);

    const results = routeRegister(config, {
      pageName: 'UserProfile',
      category: 'users',
      layout: 'DashboardLayout',
      isProtected: true,
      routePath: '/users/profile',
    });

    const routerResult = results.find((r) => r.path.includes('router.tsx'));
    expect(routerResult?.type).toBe('skipped');
  });

  it('fails if router file does not exist', () => {
    fs.unlinkSync(path.join(TEST_DIR, 'routes/router.tsx'));

    const results = routeRegister(config, {
      pageName: 'Test',
      category: 'test',
      layout: 'MainLayout',
      isProtected: false,
      routePath: '/test',
    });

    expect(results[0].type).toBe('failed');
    expect(results[0].message).toContain('Router file not found');
  });

  it('fails if routes file does not exist', () => {
    fs.unlinkSync(path.join(TEST_DIR, 'routes/routes.ts'));

    const results = routeRegister(config, {
      pageName: 'Test',
      category: 'test',
      layout: 'MainLayout',
      isProtected: false,
      routePath: '/test',
    });

    expect(results[0].type).toBe('failed');
    expect(results[0].message).toContain('Routes file not found');
  });

  it('uses correct page suffix from config', () => {
    config.naming.pageSuffix = 'View';

    routeRegister(config, {
      pageName: 'Dashboard',
      category: 'admin',
      layout: 'DashboardLayout',
      isProtected: true,
      routePath: '/admin/dashboard',
    });

    const updatedRouter = fs.readFileSync(
      path.join(TEST_DIR, 'routes/router.tsx'),
      'utf-8',
    );

    expect(updatedRouter).toContain('const DashboardView = lazy');
    expect(updatedRouter).toContain("import('@pages/admin/DashboardView')");
  });
});
