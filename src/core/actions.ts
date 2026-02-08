import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

import type { RqCodegenConfig } from '../config/types.js';
import { toPascalCase, toKebabCase, toConstantCase } from '../utils/string.js';
import { ensureDirectoryExists } from '../utils/fs.js';

export type ActionResult = {
  type: 'created' | 'updated' | 'skipped' | 'failed';
  path: string;
  message: string;
};

export function barrelAppend(
  barrelRelativePath: string,
  exportLine: string,
  config: RqCodegenConfig,
  data: Record<string, unknown>,
): ActionResult {
  if (!config.features.barrel) {
    return { type: 'skipped', path: barrelRelativePath, message: 'Barrel updates disabled' };
  }

  const handlebars = Handlebars.create();
  // Register needed helpers for rendering
  handlebars.registerHelper('kebabCase', (text: string) =>
    text.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase(),
  );
  handlebars.registerHelper('pascalCase', (text: string) =>
    text.replace(/[-_\s]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (_, c: string) => c.toUpperCase()),
  );
  handlebars.registerHelper('camelCase', (text: string) =>
    text.replace(/[-_\s]+(.)?/g, (_, c: string) => (c ? c.toUpperCase() : '')).replace(/^(.)/, (_, c: string) => c.toLowerCase()),
  );

  const renderedPath = handlebars.compile(barrelRelativePath)(data);
  const barrelPath = path.resolve(process.cwd(), config.srcDir, renderedPath);
  const renderedExport = handlebars.compile(exportLine)(data);

  ensureDirectoryExists(barrelPath);

  let content = '';
  if (fs.existsSync(barrelPath)) {
    content = fs.readFileSync(barrelPath, 'utf-8');
  }

  if (content.includes(renderedExport)) {
    return { type: 'skipped', path: barrelPath, message: 'Export already exists' };
  }

  const trimmedContent = content.trimEnd();
  const newContent = trimmedContent ? `${trimmedContent}\n${renderedExport}\n` : `${renderedExport}\n`;

  fs.writeFileSync(barrelPath, newContent, 'utf-8');
  return { type: 'updated', path: barrelPath, message: `Updated barrel: ${renderedPath}` };
}

export function routeRegister(
  config: RqCodegenConfig,
  data: {
    pageName: string;
    category: string;
    layout: string;
    isProtected: boolean;
    routePath: string;
  },
): ActionResult[] {
  const results: ActionResult[] = [];
  const routerFilePath = path.resolve(process.cwd(), config.srcDir, config.router.routerFile);
  const routesFilePath = path.resolve(process.cwd(), config.srcDir, config.router.routesFile);

  if (!fs.existsSync(routerFilePath)) {
    return [{ type: 'failed', path: routerFilePath, message: 'Router file not found' }];
  }
  if (!fs.existsSync(routesFilePath)) {
    return [{ type: 'failed', path: routesFilePath, message: 'Routes file not found' }];
  }

  const pascalName = toPascalCase(data.pageName);
  const kebabCategory = toKebabCase(data.category);
  const constantCategory = toConstantCase(data.category);
  const constantPage = toConstantCase(data.pageName);
  const pageSuffix = config.naming.pageSuffix;
  const pagesAlias = config.aliases.pages;

  // 1. Add lazy import to router file
  let routerContent = fs.readFileSync(routerFilePath, 'utf-8');
  const lazyImportLine = `const ${pascalName}${pageSuffix} = lazy(() => import('${pagesAlias}/${kebabCategory}/${pascalName}${pageSuffix}'));`;

  if (!routerContent.includes(lazyImportLine)) {
    const lazyImportRegex = /^const \w+ = lazy\(\(\) => import\([^)]+\)\);$/gm;
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    while ((match = lazyImportRegex.exec(routerContent)) !== null) {
      lastMatch = match;
    }

    if (lastMatch) {
      const insertPos = lastMatch.index + lastMatch[0].length;
      routerContent =
        routerContent.slice(0, insertPos) + '\n' + lazyImportLine + routerContent.slice(insertPos);
      fs.writeFileSync(routerFilePath, routerContent, 'utf-8');
      results.push({ type: 'updated', path: routerFilePath, message: `Added lazy import for ${pascalName}${pageSuffix}` });
    } else {
      results.push({
        type: 'failed',
        path: routerFilePath,
        message: `Could not find lazy import insertion point. Add manually:\n  ${lazyImportLine}`,
      });
    }
  } else {
    results.push({ type: 'skipped', path: routerFilePath, message: 'Lazy import already exists' });
  }

  // 2. Add route constant to routes file
  let routesContent = fs.readFileSync(routesFilePath, 'utf-8');
  const routeConstant = `    ${constantPage}: '${data.routePath}',`;

  // Check if category section exists
  const categoryRegex = new RegExp(`${constantCategory}:\\s*\\{([^}]*)\\}`, 's');
  const categoryMatch = categoryRegex.exec(routesContent);

  if (categoryMatch) {
    // Category exists — add the route inside it
    if (!routesContent.includes(routeConstant)) {
      const closingBrace = routesContent.indexOf('}', categoryMatch.index + categoryMatch[0].indexOf('{'));
      routesContent =
        routesContent.slice(0, closingBrace) + routeConstant + '\n  ' + routesContent.slice(closingBrace);
      fs.writeFileSync(routesFilePath, routesContent, 'utf-8');
      results.push({ type: 'updated', path: routesFilePath, message: `Added route constant ${constantCategory}.${constantPage}` });
    } else {
      results.push({ type: 'skipped', path: routesFilePath, message: 'Route constant already exists' });
    }
  } else {
    // Category doesn't exist — add it
    const newSection = `  ${constantCategory}: {\n  ${routeConstant}\n  },`;
    // Find the closing of FULL_ROUTES_PATH
    const fullRoutesEnd = routesContent.lastIndexOf('} as const');
    if (fullRoutesEnd !== -1) {
      routesContent =
        routesContent.slice(0, fullRoutesEnd) + newSection + '\n' + routesContent.slice(fullRoutesEnd);
      fs.writeFileSync(routesFilePath, routesContent, 'utf-8');
      results.push({ type: 'updated', path: routesFilePath, message: `Added new route category ${constantCategory}` });
    } else {
      results.push({
        type: 'failed',
        path: routesFilePath,
        message: `Could not find FULL_ROUTES_PATH. Add manually:\n  ${constantCategory}: { ${constantPage}: '${data.routePath}' }`,
      });
    }
  }

  return results;
}
