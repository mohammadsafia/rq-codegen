# @appswave/rq-codegen

Config-driven code generator for React + TypeScript projects. Generates API handlers, React Query hooks, DTO types, components, pages, views, validation schemas, and full features — all wired to your project's aliases, paths, and conventions.

## Table of Contents

- [When to Use](#when-to-use)
- [Quick Start](#quick-start)
- [CLI Commands](#cli-commands)
- [Generators](#generators)
  - [handler](#handler)
  - [types-dto](#types-dto)
  - [query-hook](#query-hook)
  - [mutation-hook](#mutation-hook)
  - [component-ui](#component-ui)
  - [component-shared](#component-shared)
  - [component-form](#component-form)
  - [page](#page)
  - [view](#view)
  - [shared-hook](#shared-hook)
  - [validation](#validation)
  - [feature](#feature)
- [Configuration Reference](#configuration-reference)
  - [srcDir](#srcdir)
  - [aliases](#aliases)
  - [features](#features)
  - [naming](#naming)
  - [paths](#paths)
  - [router](#router)
  - [hooks](#hooks)
  - [templatesDir](#templatesdir)
- [Feature Toggles](#feature-toggles)
- [Template Overrides](#template-overrides)
- [Path Alias Detection](#path-alias-detection)
- [Recommended Project Structure](#recommended-project-structure)
- [defineConfig()](#defineconfig)
- [Contributing](#contributing)
- [License](#license)

---

## When to Use

Use `rq-codegen` every time you need to:

- **Add a new API endpoint** — generates the handler, DTO types, query hook, and mutation hook in one command
- **Create a new page or view** — scaffolds the component with correct folder structure and barrel exports
- **Build a full feature** — generates everything at once: handler + types + hooks + view + page + validation
- **Add a new UI component** — creates a CVA-based component with variants (shadcn/ui style)
- **Add a shared component** — creates a compound component with sub-components (Header, Body, Footer)
- **Add a form component** — creates a React Hook Form `useController`-based field component
- **Add a validation schema** — scaffolds a Zod schema with optional i18n support
- **Add a custom hook** — creates a shared utility hook with selected React imports

Every generated file respects your project's path aliases, naming conventions, and feature toggles — no manual find-and-replace needed.

---

## Quick Start

### 1. Install

```bash
npm install -g @appswave/rq-codegen
```

Or as a dev dependency:

```bash
npm install -D @appswave/rq-codegen
```

### 2. Initialize Config

```bash
rq-codegen init
```

This creates `rqgen.config.ts` in your project root with auto-detected settings:
- Reads your `tsconfig.json` / `tsconfig.app.json` to detect path aliases
- Detects if you have `src/`, `routes/`, `locales/` directories
- Asks about i18n, toast, and route registration preferences

### 3. Generate Code

```bash
# Interactive menu — pick from 12 generators
rq-codegen

# Or run a specific generator directly
rq-codegen handler
rq-codegen feature
rq-codegen page
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `rq-codegen` | Interactive menu — select a generator from the list |
| `rq-codegen <generator>` | Run a specific generator directly (e.g., `rq-codegen handler`) |
| `rq-codegen init` | Create `rqgen.config.ts` with auto-detected settings |
| `rq-codegen init --force` | Overwrite existing config file |
| `rq-codegen --version` | Show version |
| `rq-codegen --help` | Show help |

### Interactive Menu

When you run `rq-codegen` without arguments, you get an interactive menu:

```
? What would you like to generate?
  component-ui       — CVA-based UI component (shadcn/ui style)
  component-shared   — Compound shared component
  component-form     — React Hook Form component (useController-based)
  page               — Route-level page component
  view               — Feature view component
  handler            — API handler (+ types + hooks)
  query-hook         — React Query hook
  mutation-hook      — React Query mutation hook
  types-dto          — DTO type definitions
  shared-hook        — Custom utility hook
  validation         — Zod validation schema
  feature            — Full feature scaffold (handler + types + hooks + view + page)
```

---

## Generators

### handler

The most powerful single generator. Creates an API handler with typed request functions, and optionally chains DTO types, query hooks, and mutation hooks.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Entity name | `products` | Plural name for the handler (used for file names, handler object) |
| Singular name | `product` | Used for mutation hook names (e.g., `useCreateProductMutation`) |
| Endpoint key | `PRODUCTS` | ApiEndpoints constant key (e.g., `ApiEndpoints.PRODUCTS`) |
| Operations | `list, details, create, update, delete` | Which CRUD operations to generate |
| Also generate DTO types? | `Yes` | Chains the `types-dto` generator |
| Also generate query hooks? | `Yes` | Chains the `query-hook` generator |
| Is list paginated? | `No` | Uses paginated query hook variant |
| Also generate mutation hooks? | `Yes` | Chains the `mutation-hook` generator |

**Example:** `rq-codegen handler` with entity `products`, all operations, all chains enabled:

```
  CREATED  src/api/handlers/products.ts
  UPDATED  src/api/handlers/index.ts
  CREATED  src/types/api/ProductsDto.ts
  UPDATED  src/types/api/index.ts
  CREATED  src/lib/hooks/queries/useProductsListQuery.ts
  UPDATED  src/lib/hooks/queries/index.ts
  CREATED  src/lib/hooks/queries/useProductsDetailsQuery.ts
  UPDATED  src/lib/hooks/queries/index.ts
  CREATED  src/lib/hooks/mutations/useCreateProductMutation.ts
  UPDATED  src/lib/hooks/mutations/index.ts
  CREATED  src/lib/hooks/mutations/useUpdateProductMutation.ts
  UPDATED  src/lib/hooks/mutations/index.ts
  CREATED  src/lib/hooks/mutations/useDeleteProductMutation.ts
  UPDATED  src/lib/hooks/mutations/index.ts

  Done! 7 file(s) created, 6 barrel(s) updated.
```

**Generated handler (`products.ts`):**

```typescript
import { ApiEndpoints, HttpClient } from '@api/config';

import type {
  ProductsForReadDto,
  ProductsListResponseDto,
  ProductsForCreateDto,
  ProductsForUpdateDto,
} from '@app-types';

const URL = ApiEndpoints.PRODUCTS;

function getProductsList(queryString?: string): Promise<ProductsListResponseDto> {
  const url = queryString ? `${URL.INDEX}?${queryString}` : URL.INDEX;
  return HttpClient.get<ProductsListResponseDto>(url);
}

function getProductsDetails(id: string): Promise<ProductsForReadDto> {
  return HttpClient.get<ProductsForReadDto>(URL.DETAILS.replace(':id', id));
}

function createProducts(payload: ProductsForCreateDto): Promise<ProductsForReadDto> {
  return HttpClient.post<ProductsForReadDto>(URL.INDEX, payload);
}

function updateProducts(id: string, payload: ProductsForUpdateDto): Promise<ProductsForReadDto> {
  return HttpClient.put<ProductsForReadDto>(URL.DETAILS.replace(':id', id), payload);
}

function removeProducts(id: string): Promise<void> {
  return HttpClient.delete<void>(URL.DETAILS.replace(':id', id));
}

export const ProductsHandler = {
  list: {
    queryKey: 'products/list',
    request: getProductsList,
  },
  details: {
    queryKey: 'products/details',
    request: getProductsDetails,
  },
  create: {
    mutationKey: 'products/create',
    mutationFn: createProducts,
  },
  update: {
    mutationKey: 'products/update',
    mutationFn: updateProducts,
  },
  remove: {
    mutationKey: 'products/remove',
    mutationFn: removeProducts,
  },
} as const;
```

---

### types-dto

Generates DTO type definitions for an API entity.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Entity name | `products` | Name used for type prefixes |
| Include create DTO? | `Yes` | Adds `ForCreateDto` type |
| Include update DTO? | `Yes` | Adds `ForUpdateDto` type |

**Generated types (`ProductsDto.ts`):**

```typescript
export type ProductsForReadDto = {
  id: number;
  // TODO: Add read fields
};

export type ProductsForCreateDto = {
  // TODO: Add create fields
};

export type ProductsForUpdateDto = {
  id: number;
  // TODO: Add update fields
};

export type ProductsListDto = {
  id: number;
  // TODO: Add minimal list fields
};

export type ProductsListResponseDto = {
  items: ProductsListDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  lastPage: number;
};

export type ProductsParamsDto = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  filter?: string;
};
```

The DTO suffix names (`ForReadDto`, `ForCreateDto`, etc.) are fully configurable via `naming.dtoSuffixes` in your config.

---

### query-hook

Generates a React Query hook that wraps a handler.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Hook name | `productsList` | Used in `useProductsListQuery` |
| Handler name | `products` | References the handler (e.g., `ProductsHandler`) |
| Handler key | `list` | Handler method key (e.g., `ProductsHandler.list`) |
| Is paginated? | `No` | Uses paginated hook variant |

**Generated query hook (standard):**

```typescript
import { ProductsHandler } from '@api/handlers';
import { useQuery } from '@tanstack/react-query';

export const useProductsListQuery = (enabled = true) => {
  return useQuery({
    queryKey: [ProductsHandler.list.queryKey],
    queryFn: () => ProductsHandler.list.request(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
```

**Generated query hook (details variant):**

```typescript
import { ProductsHandler } from '@api/handlers';
import { useQuery } from '@tanstack/react-query';

export const useProductsDetailsQuery = (id: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: [ProductsHandler.details.queryKey, id],
    queryFn: () => ProductsHandler.details.request(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
```

**Generated query hook (paginated variant):**

```typescript
import { ProductsHandler } from '@api/handlers';
import { usePaginatedDataTableQuery } from '@hooks/utils';

import type { ProductsListDto } from '@app-types';

export const useProductsPaginatedQuery = () => {
  return usePaginatedDataTableQuery<ProductsListDto>({
    queryKey: [ProductsHandler.list.queryKey],
    queryFn: (params: string) => ProductsHandler.list.request(params),
    defaultPageSize: 10,
  });
};
```

---

### mutation-hook

Generates a React Query mutation hook with automatic query invalidation, toast notifications, and i18n support.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Mutation name | `CreateProduct` | Used in `useCreateProductMutation` |
| Handler name | `products` | References the handler |
| Handler key | `create` | Handler method key |
| Invalidate key | `list` | Query key to invalidate on success |

**Generated mutation hook (with i18n + toast enabled):**

```typescript
import { ProductsHandler } from '@api/handlers';
import { useToast } from '@hooks/shared';
import { useAppTranslation } from '@hooks/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useAppTranslation();

  return useMutation({
    mutationKey: [ProductsHandler.create.mutationKey],
    mutationFn: ProductsHandler.create.mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ProductsHandler.list.queryKey],
      });
      toast({
        variant: 'success',
        title: t('common.success'),
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.title || error?.response?.data?.message || t('errors.unexpectedError');
      toast({
        variant: 'destructive',
        title: errorMessage,
        description: error?.response?.data?.detail || '',
      });
    },
  });
};
```

When `features.toast` or `features.i18n` is disabled, the corresponding import and usage lines are omitted automatically.

---

### component-ui

Generates a CVA-based UI component (shadcn/ui style) with variants and barrel export.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Component name | `StatusBadge` | PascalCase component name |

**Generated files:**

```
src/components/ui/status-badge/StatusBadge.tsx
src/components/ui/status-badge/index.ts
```

**Generated component:**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@utils';

export const statusBadgeVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: '',
      },
      size: {
        sm: '',
        md: '',
        lg: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;

type StatusBadgeProps = React.ComponentPropsWithoutRef<'div'> & StatusBadgeVariants;

export default function StatusBadge({ className, variant, size, children, ...props }: StatusBadgeProps) {
  return (
    <div
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </div>
  );
}
```

---

### component-shared

Generates a compound shared component with configurable sub-components.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Component name | `InfoCard` | PascalCase component name |
| Sub-components | `Header, Body, Footer` | Comma-separated sub-component names |

**Generated files:**

```
src/components/shared/info-card/InfoCard.tsx
src/components/shared/info-card/index.ts
```

**Generated component:**

```typescript
import { type FC, type ReactNode } from 'react';
import { cn } from '@utils';

type HeaderProps = {
  children: ReactNode;
  className?: string;
};

type BodyProps = {
  children: ReactNode;
  className?: string;
};

type InfoCardProps = {
  children: ReactNode;
  className?: string;
};

type InfoCardComponent = FC<InfoCardProps> & {
  Header: FC<HeaderProps>;
  Body: FC<BodyProps>;
};

const Header: FC<HeaderProps> = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
);

const Body: FC<BodyProps> = ({ children, className }) => (
  <div className={cn('', className)}>{children}</div>
);

const InfoCard: InfoCardComponent = ({ children, className }) => (
  <div className={cn('rounded-lg border bg-card', className)}>{children}</div>
);

InfoCard.Header = Header;
InfoCard.Body = Body;

export default InfoCard;
```

**Usage:**

```tsx
<InfoCard>
  <InfoCard.Header>Title</InfoCard.Header>
  <InfoCard.Body>Content</InfoCard.Body>
</InfoCard>
```

---

### component-form

Generates a React Hook Form `useController`-based form field component.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Component name | `PhoneInput` | PascalCase component name |

**Generated files:**

```
src/components/forms/form-phone-input/FormPhoneInput.tsx
src/components/forms/form-phone-input/index.ts
```

---

### page

Generates a route-level page component. Optionally auto-registers the route in your router.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Page name | `Dashboard` | PascalCase page name |
| Category | `admin` or `Create new category` | Folder grouping |
| Register route? | `Yes` | (Only when `routeRegistration` enabled) |
| Layout | `DashboardLayout` | (Only when registering route) |
| Is protected? | `Yes` | (Only when registering route) |
| Route path | `/admin/dashboard` | (Only when registering route) |

**Generated file:**

```
src/pages/admin/DashboardPage.tsx
```

**Generated component:**

```typescript
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}
```

The page suffix (`Page`) is configurable via `naming.pageSuffix`.

---

### view

Generates a feature view component with barrel exports.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| View name | `ProductCard` | PascalCase view name |
| Category | `products` or `Create new category` | Feature folder grouping |

**Generated files:**

```
src/views/products/product-card/ProductCard.tsx
src/views/products/product-card/index.ts
```

---

### shared-hook

Generates a custom utility hook.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Hook name | `windowSize` | camelCase name (generates `useWindowSize`) |
| React imports | `useState, useEffect` | Selected from checkbox |

**Generated file:**

```
src/lib/hooks/shared/useWindowSize.ts
```

**Generated hook:**

```typescript
import { useState, useEffect } from 'react';

export const useWindowSize = () => {
  // TODO: Implement hook logic

  return {
    // TODO: Return hook values
  };
};
```

---

### validation

Generates a Zod validation schema with optional i18n support.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Schema name | `product` | camelCase name |

**Generated file:**

```
src/validations/product.schema.ts
```

**Generated schema (with i18n enabled):**

```typescript
import { z } from 'zod';
import type { TFunction } from 'i18next';

export const productSchema = (t: TFunction) =>
  z.object({
    // TODO: Add validation fields
    // Example:
    // name: z.string().min(1, t('validation.product.name.required')),
  });

export type ProductFormData = z.infer<ReturnType<typeof productSchema>>;
```

**Generated schema (without i18n):**

```typescript
import { z } from 'zod';

export const productSchema = z.object({
  // TODO: Add validation fields
  // Example:
  // name: z.string().min(1, 'Name is required'),
});

export type ProductFormData = z.infer<typeof productSchema>;
```

The validation file suffix (`.schema.ts`) is configurable via `naming.validationSuffix`.

---

### feature

The composite generator. Scaffolds an entire feature in one command — selecting which artifacts to generate.

**Prompts:**

| Prompt | Example | Description |
|--------|---------|-------------|
| Feature name | `products` | Plural entity name |
| Singular name | `product` | For mutation naming |
| Endpoint key | `PRODUCTS` | ApiEndpoints constant |
| Artifacts | (checkbox) | Select what to generate |
| Is paginated? | `No` | (When query list selected) |

**Available artifacts:**

- API Handler
- DTO Types
- Query Hook (list)
- Query Hook (details)
- Mutation Hook (create)
- Mutation Hook (update)
- Mutation Hook (delete)
- View Component
- Page Component
- Validation Schema

**Example:** Running `rq-codegen feature` with `products`, all artifacts selected:

```
  CREATED  src/types/api/ProductsDto.ts
  UPDATED  src/types/api/index.ts
  CREATED  src/api/handlers/products.ts
  UPDATED  src/api/handlers/index.ts
  CREATED  src/lib/hooks/queries/useProductsListQuery.ts
  UPDATED  src/lib/hooks/queries/index.ts
  CREATED  src/lib/hooks/queries/useProductsDetailsQuery.ts
  UPDATED  src/lib/hooks/queries/index.ts
  CREATED  src/lib/hooks/mutations/useCreateProductMutation.ts
  UPDATED  src/lib/hooks/mutations/index.ts
  CREATED  src/lib/hooks/mutations/useUpdateProductMutation.ts
  UPDATED  src/lib/hooks/mutations/index.ts
  CREATED  src/lib/hooks/mutations/useDeleteProductMutation.ts
  UPDATED  src/lib/hooks/mutations/index.ts
  CREATED  src/views/products/products-list/ProductsList.tsx
  CREATED  src/views/products/products-list/index.ts
  UPDATED  src/views/products/index.ts
  UPDATED  src/views/index.ts
  CREATED  src/pages/products/ProductsPage.tsx
  CREATED  src/validations/products.schema.ts
  UPDATED  src/validations/index.ts

  Done! 11 file(s) created, 10 barrel(s) updated.
```

---

## Configuration Reference

Configuration is loaded from `rqgen.config.ts` (or `.js`, `.mjs`, `.mts`) in your project root, or from a `"rqgen"` field in `package.json`.

### Full Config Example

```typescript
// rqgen.config.ts
import { defineConfig } from '@appswave/rq-codegen';

export default defineConfig({
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

  templatesDir: './my-templates',
});
```

### srcDir

**Type:** `string`
**Default:** `'./src'`

Root source directory. All `paths` are relative to this directory.

```typescript
srcDir: './src',
```

### aliases

**Type:** `AliasConfig`

Path aliases used in import statements of generated files. These should match your `tsconfig.json` `paths` configuration.

```typescript
aliases: {
  api: '@api',           // Used in: import { HttpClient } from '@api/config'
  components: '@components', // Used in: import { Button } from '@components/ui'
  hooks: '@hooks',       // Used in: import { useToast } from '@hooks/shared'
  types: '@app-types',   // Used in: import type { UserDto } from '@app-types'
  utils: '@utils',       // Used in: import { cn } from '@utils'
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
```

**Tip:** `rq-codegen init` auto-detects aliases from your `tsconfig.json` or `tsconfig.app.json`.

### features

**Type:** `FeatureToggles`

Toggle features on/off to control what gets generated. See [Feature Toggles](#feature-toggles) for details.

```typescript
features: {
  i18n: true,              // Include i18n imports in mutations and validations
  toast: true,             // Include toast notifications in mutations
  barrel: true,            // Auto-update barrel (index.ts) exports
  routeRegistration: true, // Enable route auto-registration for pages
},
```

### naming

**Type:** `NamingConfig`

Customize naming conventions for generated files and types.

```typescript
naming: {
  dtoSuffixes: {
    read: 'ForReadDto',            // e.g., ProductsForReadDto
    create: 'ForCreateDto',        // e.g., ProductsForCreateDto
    update: 'ForUpdateDto',        // e.g., ProductsForUpdateDto
    list: 'ListDto',               // e.g., ProductsListDto
    listResponse: 'ListResponseDto', // e.g., ProductsListResponseDto
    params: 'ParamsDto',           // e.g., ProductsParamsDto
  },
  validationSuffix: '.schema.ts', // File suffix: product.schema.ts
  pageSuffix: 'Page',             // Component suffix: DashboardPage
  hookPrefix: 'use',              // Hook prefix: useProducts
},
```

**Custom DTO suffixes example:**

```typescript
naming: {
  dtoSuffixes: {
    read: 'Dto',        // ProductsDto instead of ProductsForReadDto
    create: 'CreateDto', // ProductsCreateDto instead of ProductsForCreateDto
  },
},
```

### paths

**Type:** `PathsConfig`

Relative paths (from `srcDir`) where generated files are placed.

```typescript
paths: {
  handlers: 'api/handlers',            // API handler files
  apiConfig: 'api/config',             // ApiEndpoints, HttpClient
  types: 'types/api',                  // DTO type definitions
  queries: 'lib/hooks/queries',        // React Query hooks
  mutations: 'lib/hooks/mutations',    // Mutation hooks
  sharedHooks: 'lib/hooks/shared',     // Shared utility hooks
  hookUtils: 'lib/hooks/utils',        // Hook utilities (pagination, etc.)
  uiComponents: 'components/ui',       // UI primitives (shadcn/ui style)
  sharedComponents: 'components/shared', // Compound shared components
  formComponents: 'components/forms',   // Form field components
  pages: 'pages',                       // Route-level pages
  views: 'views',                       // Feature view components
  validations: 'validations',           // Zod validation schemas
},
```

### router

**Type:** `RouterConfig`

Configuration for route auto-registration (used by the `page` generator when `features.routeRegistration` is enabled).

```typescript
router: {
  routerFile: 'routes/router.tsx',           // File containing React Router config
  routesFile: 'routes/routes.ts',            // File containing route constants
  layouts: ['MainLayout', 'DashboardLayout'], // Available layout options
},
```

### hooks

**Type:** `HooksConfig`

Configure import paths for hooks used in generated templates. This allows the generated code to import the exact hooks your project provides.

```typescript
hooks: {
  toast: {
    import: 'useToast',           // Hook function name
    from: '@hooks/shared',        // Import path
  },
  translation: {
    import: 'useAppTranslation',  // Hook function name
    from: '@hooks/shared',        // Import path
  },
  paginatedQuery: {
    import: 'usePaginatedDataTableQuery', // Hook function name
    from: '@hooks/utils',                  // Import path
  },
},
```

### templatesDir

**Type:** `string | undefined`
**Default:** `undefined` (uses bundled templates)

Path to a local directory containing template overrides. Any `.hbs` file found in this directory takes precedence over the bundled template with the same relative path.

```typescript
templatesDir: './my-templates',
```

See [Template Overrides](#template-overrides) for details.

---

## Feature Toggles

### `i18n`

When **enabled**, generated code includes:
- `import type { TFunction } from 'i18next'` in validation schemas
- Validation schemas accept a `t` function parameter for translated messages
- `import { useAppTranslation } from '@hooks/shared'` in mutation hooks
- Translated toast messages using `t('common.success')`

When **disabled**, all i18n-related imports and logic are omitted.

### `toast`

When **enabled**, generated mutation hooks include:
- `import { useToast } from '@hooks/shared'`
- `onSuccess` toast notification
- `onError` toast notification with error message extraction

When **disabled**, mutation hooks omit all toast-related code.

### `barrel`

When **enabled**, every generator that creates a file also adds an `export * from './...'` line to the nearest `index.ts` barrel file. If the barrel file doesn't exist, it's created.

When **disabled**, barrel exports are skipped — you manage imports manually.

### `routeRegistration`

When **enabled**, the `page` generator shows additional prompts:
- Which layout to use
- Whether the route is protected
- The route URL path

And generates a `route-register` action that adds the lazy import and route entry to your router files.

When **disabled**, the `page` generator only creates the page component file.

---

## Template Overrides

Every generated file comes from a Handlebars template (`.hbs`). You can override any template by creating a local copy.

### Steps

1. Set `templatesDir` in your config:

```typescript
export default defineConfig({
  templatesDir: './templates',
});
```

2. Create the template file with the same relative path as the bundled template:

```
your-project/
├── templates/
│   └── handler/
│       └── handler.ts.hbs    # Overrides the default handler template
└── rqgen.config.ts
```

3. The local template is used instead of the bundled one. All Handlebars helpers (`configAlias`, `dtoSuffix`, `ifFeature`, `pascalCase`, etc.) are available.

### Available Templates

| Path | Description |
|------|-------------|
| `component-ui/Component.tsx.hbs` | CVA UI component |
| `component-ui/index.ts.hbs` | UI component barrel |
| `component-shared/Component.tsx.hbs` | Compound shared component |
| `component-shared/index.ts.hbs` | Shared component barrel |
| `component-form/FormComponent.tsx.hbs` | Form field component |
| `component-form/index.ts.hbs` | Form component barrel |
| `page/Page.tsx.hbs` | Page component |
| `view/View.tsx.hbs` | View component |
| `view/index.ts.hbs` | View barrel |
| `handler/handler.ts.hbs` | API handler |
| `query-hook/hook.ts.hbs` | Standard query hook |
| `query-hook/hook-details.ts.hbs` | Details query hook |
| `query-hook/hook-paginated.ts.hbs` | Paginated query hook |
| `mutation-hook/hook.ts.hbs` | Mutation hook |
| `types-dto/dto.ts.hbs` | DTO type definitions |
| `shared-hook/hook.ts.hbs` | Shared utility hook |
| `validation/validation.ts.hbs` | Zod validation schema |

### Available Handlebars Helpers

| Helper | Usage | Description |
|--------|-------|-------------|
| `pascalCase` | `{{pascalCase name}}` | Converts to PascalCase |
| `camelCase` | `{{camelCase name}}` | Converts to camelCase |
| `kebabCase` | `{{kebabCase name}}` | Converts to kebab-case |
| `constantCase` | `{{constantCase name}}` | Converts to CONSTANT_CASE |
| `configAlias` | `{{configAlias "api"}}` | Returns alias from config (e.g., `@api`) |
| `configPath` | `{{configPath "handlers"}}` | Returns path from config |
| `dtoSuffix` | `{{dtoSuffix "read"}}` | Returns DTO suffix (e.g., `ForReadDto`) |
| `ifFeature` | `{{#ifFeature "toast"}}...{{/ifFeature}}` | Conditional block based on feature toggle |
| `plural` | `{{plural name}}` | Basic pluralization |
| `eq` | `{{#if (eq a b)}}` | Equality check |
| `neq` | `{{#if (neq a b)}}` | Inequality check |
| `includes` | `{{#if (includes arr val)}}` | Array includes check |
| `join` | `{{join arr ", "}}` | Join array with separator |

---

## Path Alias Detection

When you run `rq-codegen init`, aliases are auto-detected from your TypeScript config:

1. Reads `tsconfig.json` in the current directory
2. If it has `"extends"`, follows to `tsconfig.app.json` (or whatever it extends)
3. Parses the `compilerOptions.paths` field
4. Maps known alias patterns to config keys:

| tsconfig paths | Config key | Default value |
|---------------|------------|---------------|
| `@api/*` | `aliases.api` | `@api` |
| `@components/*` | `aliases.components` | `@components` |
| `@hooks/*` | `aliases.hooks` | `@hooks` |
| `@app-types` or `@types/*` | `aliases.types` | `@app-types` |
| `@utils` | `aliases.utils` | `@utils` |
| `@contexts` | `aliases.contexts` | `@contexts` |
| `@constants` | `aliases.constants` | `@constants` |
| `@views/*` | `aliases.views` | `@views` |
| `@pages/*` | `aliases.pages` | `@pages` |
| `@validations/*` | `aliases.validations` | `@validations` |
| `@assets/*` | `aliases.assets` | `@assets` |
| `@routes` | `aliases.routes` | `@routes` |
| `@hoc` | `aliases.hoc` | `@hoc` |
| `@app-config` | `aliases.appConfig` | `@app-config` |

---

## Recommended Project Structure

`rq-codegen` works best with this structure (all paths are configurable):

```
src/
├── api/
│   ├── config/              # ApiEndpoints.ts, HttpClient.ts, etc.
│   └── handlers/            # Generated API handlers + index.ts barrel
├── components/
│   ├── ui/                  # Generated UI components + index.ts barrel
│   ├── shared/              # Generated shared components + index.ts barrel
│   └── forms/               # Generated form components + index.ts barrel
├── lib/
│   └── hooks/
│       ├── queries/         # Generated query hooks + index.ts barrel
│       ├── mutations/       # Generated mutation hooks + index.ts barrel
│       ├── shared/          # Generated shared hooks + index.ts barrel
│       └── utils/           # Paginated query hook, etc.
├── pages/                   # Generated pages (grouped by category)
├── views/                   # Generated views (grouped by feature)
├── types/
│   └── api/                 # Generated DTO types + index.ts barrel
├── validations/             # Generated Zod schemas + index.ts barrel
└── routes/                  # Router config (for auto-registration)
```

---

## defineConfig()

The `defineConfig()` helper provides type-safe configuration with IntelliSense:

```typescript
// rqgen.config.ts
import { defineConfig } from '@appswave/rq-codegen';

export default defineConfig({
  // Full IntelliSense for all config options
  features: {
    i18n: true,
  },
});
```

You only need to specify the fields you want to override — everything else uses sensible defaults.

### Exported Types

```typescript
import type {
  RqCodegenConfig,
  AliasConfig,
  FeatureToggles,
  NamingConfig,
  PathsConfig,
  RouterConfig,
  HooksConfig,
  HookImportConfig,
  DtoSuffixes,
} from '@appswave/rq-codegen';
```

---

## Contributing

### Setup

```bash
git clone <repo-url>
cd rq-codegen
npm install
```

### Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run typecheck

# Run tests
npm test

# Watch tests
npm run test:watch
```

### Local Testing

```bash
# Link globally
npm link

# Use in any project
cd /path/to/your/project
rq-codegen init
rq-codegen handler
```

### Project Structure

```
rq-codegen/
├── bin/cli.ts                     # CLI entry point
├── src/
│   ├── index.ts                   # Public API (defineConfig + types)
│   ├── cli.ts                     # Commander setup
│   ├── commands/
│   │   ├── generate.ts            # rq-codegen [generator]
│   │   └── init.ts                # rq-codegen init
│   ├── config/
│   │   ├── types.ts               # RqCodegenConfig type
│   │   ├── schema.ts              # Zod validation
│   │   ├── defaults.ts            # Default values
│   │   └── loader.ts              # Config discovery + merge
│   ├── core/
│   │   ├── engine.ts              # Handlebars engine + action executor
│   │   ├── helpers.ts             # 13 Handlebars helpers
│   │   ├── actions.ts             # barrel-append + route-register
│   │   └── template-resolver.ts   # Local override fallback
│   ├── generators/                # 12 generators
│   └── utils/                     # String, validation, filesystem utilities
├── templates/                     # 17 bundled Handlebars templates
├── tsup.config.ts                 # Build config (ESM)
└── vitest.config.ts               # Test config
```

---

## License

MIT
