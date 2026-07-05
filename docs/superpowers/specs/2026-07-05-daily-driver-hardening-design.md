# rq-codegen Daily-Driver Hardening — Design

**Date:** 2026-07-05
**Status:** Approved (design), pending implementation plan
**Author:** Appswave FE + Claude

## Goal

Make `@appswave/rq-codegen` safe and ergonomic to run **non-interactively from `package.json` scripts** (e.g. a `dto:gen` script), and harden it into a reliable daily-driver tool that behaves correctly in **all project states** — including empty/unprepared projects. The current tool is interactive-only and has several correctness and robustness gaps that block script usage and daily reliance.

## Background — current architecture

The tool has a clean core worth preserving:

- **Action pipeline.** Generators are pure functions `(answers, config) => GeneratorAction[]`. A single engine (`executeActions`) interprets actions (`add`, `barrel-append`, `route-register`, `endpoint-register`). Generators never touch the filesystem — this is why they are highly testable (285 unit tests, all passing).
- **Config-driven.** `rqgen.config.ts` (paths / aliases / naming / features / router / hooks) is Zod-validated and deep-merged over `DEFAULT_CONFIG`. The same tool adapts to any project layout.
- **Handlebars templates** resolved from a local override dir (`config.templatesDir`) then bundled `templates/`.

The weak seam is **I/O and code mutation**: interactivity and file-editing (regex-based) are where the daily-use gaps live.

## Gaps this design addresses

1. **No non-interactive mode (blocker).** `runGenerate` always calls `inquirer.prompt`. From an npm script it hangs on stdin. No way to pass `--name Product --operations list,details`.
2. **No `--dry-run` / `--force`.** Existing files are silently *skipped*; no preview; no overwrite.
3. **Fragile code mutation.** `route-register` / `endpoint-register` use regex + string-index surgery assuming exact structure (`} as const`, `children: [`, `── Public` comment markers). Breaks across projects.
4. **Empty/unprepared project handling.** Endpoint/route registration fail hard when target files are missing. No readiness check.
5. **`feature` generator bug.** Unlike standalone `handler`, `feature` never emits an `endpoint-register` action (it lacks an `apiBaseUrl` input), so it scaffolds a handler referencing an `ApiEndpoints` key that was never added. It also never route-registers its page.
6. **Duplicated Handlebars helpers.** `actions.ts` reimplements kebab/pascal/camel inline instead of reusing `helpers.ts` (drift risk).
7. **Version drift.** `cli.ts` hardcodes `'0.1.1'`; `package.json` is `0.1.2`.
8. **Loose typing.** `as never` casts throughout `generators/index.ts`; no shared per-generator input schema.
9. **No `list` command.** Generators are discoverable only via the interactive menu.
10. **No command/integration tests.** Strong unit coverage, but zero coverage for empty project, missing config, existing files, `--force`, `--dry-run`, or non-interactive flags.

## Decisions (locked)

- **Scope:** full architectural hardening (one cohesive spec, phased implementation).
- **CLI shape:** typed subcommands per generator (self-documenting `--help`), derived from a single field schema.
- **Mutation:** AST-based via `ts-morph`.
- **Preflight:** a `doctor` command plus on-demand auto-scaffolding of missing prerequisites.
- **Testing:** both full E2E matrix (temp-dir fixtures, spawns built CLI) and unit tests for each new pure module.

---

## Design

### 1. Foundation: unified Field Schema

Introduce one declarative field schema per generator and derive prompts, flags, and validation from it. This is the single change that unblocks script usage **and** removes the `as never` casts and prompt/flag drift risk.

```ts
type Choice = { name: string; value: string; checked?: boolean };
type Validator = (value: string) => true | string;

type GeneratorField =
  | { name: string; type: 'input';    message: string; required?: boolean; default?: string; validate?: Validator; when?: (a: Record<string, unknown>) => boolean }
  | { name: string; type: 'confirm';  message: string; default: boolean;   when?: (a: Record<string, unknown>) => boolean }   // → --foo / --no-foo
  | { name: string; type: 'checkbox'; message: string; choices: Choice[];   when?: (a: Record<string, unknown>) => boolean }   // → --foo a,b,c
  | { name: string; type: 'list';     message: string; choices: Choice[]; default: string; when?: (a: Record<string, unknown>) => boolean };
```

Three pure derivation functions (each unit-tested), living in `src/core/fields.ts`:

- `fieldsToPrompts(fields)` → inquirer prompt objects (preserves current interactive behavior).
- `fieldsToOptions(fields)` → commander option descriptors:
  - `input` → `--<name> <value>`
  - `confirm` (default true) → `--no-<name>`; (default false) → `--<name>`
  - `checkbox` → `--<name> <csv>` parsed to `string[]`
  - `list` → `--<name> <value>` validated against `choices`
- `resolveAnswers(fields, flags, { interactive })` → the final answers object:
  - Non-interactive: start from field defaults, apply provided flags, coerce checkbox CSV → array; a missing **required** field is a clear error (exit code 1), never a hang.
  - Interactive: prompt only for fields not already satisfied by flags; honor `when`.

**Generator change:** replace `prompts: (config) => unknown[]` with `fields: (config) => GeneratorField[]`. `actions()` and `preprocess()` are unchanged. `GeneratorDefinition` gains typed answers via the field set, dropping `as never`.

### 2. CLI restructure (`src/cli.ts`)

- Register **one commander subcommand per generator**, with options from `fieldsToOptions`. `rq-codegen types-dto --help` lists every flag with description and default.
- Preserve current UX:
  - `rq-codegen` (no args) → interactive generator menu.
  - `rq-codegen <generator>` (no flags) → interactive prompts.
- **Global flags** (apply to every generator subcommand):
  - `--yes` / `-y`: non-interactive; defaults fill unspecified fields; missing required → error.
  - `--dry-run`: compute and report actions; write nothing.
  - `--force` / `-f`: overwrite existing files instead of skipping.
  - `--interactive`: force prompting for whatever flags did not cover.
- New commands: `doctor` (§4) and `list` (human table; `--json` for tooling).
- Read version from `package.json` (fixes drift). At build time the version is inlined or read relative to the package root.

### 3. Engine: dry-run & force (`src/core/engine.ts`)

`executeActions(actions, answers, config, opts: { dryRun?: boolean; force?: boolean })`:

- `add`:
  - exists + no force → `skipped` ("File already exists")
  - exists + force → `overwritten`
  - not exists → `created`
  - `dryRun` → report the would-be outcome (`would create` / `would overwrite`), no write.
- `barrel-append`, `route-register`, `endpoint-register`: honor `dryRun` (compute the change, report, no write).
- `ActionResult.type` gains `'overwritten'`; the CLI result summary prints it distinctly.
- Remove the module-level mutable `handlebarsInstance` singleton and `resetHandlebars`; build a per-run Handlebars instance and thread it through, eliminating cross-run state.

### 4. Preflight, scaffold & `doctor`

- **`doctor` command:** prints a readiness table — config present? each required target file present (`ApiEndpoints.ts`, relevant barrels, `routes.ts`/`router.tsx` when `routeRegistration` on)? `doctor --fix` scaffolds all prerequisites up front.
- **On-demand scaffold during generate:** before executing mutation actions, create missing **safe/universal** files:
  - `ApiEndpoints.ts` → `export const ApiEndpoints = {} as const;`
  - empty barrels (`index.ts`) as needed (barrel-append already creates these; formalize as preflight).
- **Router/routes (opinionated, noted):** only when `routeRegistration` is enabled **and** the file is absent, scaffold a **minimal opinionated** `routes.ts` / `router.tsx` and print a clear note that a template was generated. (Rationale: router shape is project-specific; auto-scaffolding is the chosen behavior, but flagged so a wrong-shaped router is never silently assumed.)
- **Missing config** remains a guided error directing the user to `rq-codegen init` (never a hang).

Preflight logic lives in `src/core/preflight.ts` (pure where possible: given config + planned actions, return the list of files to scaffold), so it is unit-testable.

### 5. AST-based mutation (`src/core/ast/`)

Replace regex/string-index surgery with `ts-morph` edits, isolated into modules that take `sourceText → newText` (no filesystem in unit tests):

- `endpoints.ts` — locate the `ApiEndpoints` object literal (the `... as const` object), add/merge the endpoint property (`INDEX`, and `DETAILS` when details/update/delete selected). Idempotent: existing key → no-op.
- `routes.ts` — insert the route constant into the routes object under the correct category, creating the category if absent. Idempotent.
- `router.ts` — add the lazy import declaration; insert the `<Route>`/route-element into the correct layout's `children` array, matched by AST (identifier/JSX), not comment markers. Distinguishes protected vs public by AST structure. Idempotent.

`actions.ts` orchestrates: read file → call AST module → write (respecting `dryRun`). `barrel-append` stays string-based but uses the shared helpers from `helpers.ts` (removes the duplicated inline kebab/pascal/camel).

Adds dependency: `ts-morph`.

### 6. Fix the `feature` generator

- Add an `apiBaseUrl` field to `feature` (currently missing).
- Emit `endpoint-register` in the handler branch (using `endpointKey` + `apiBaseUrl` + derived operations), matching the standalone `handler` behavior.
- Emit `route-register` for the page branch when `routeRegistration` is enabled (category/layout/routePath from fields or sensible defaults).

Result: `feature` becomes a true superset of the individual generators — no dangling endpoint keys, page routes registered.

### 7. Consistency cleanups

- Dedupe Handlebars helpers (§5): single source in `helpers.ts`.
- Version from `package.json` (§2).
- Remove `as never` casts via typed fields (§1).
- `list` command (§2).

### 8. Testing

**Unit (new pure logic):**
- `fields.test.ts` — `fieldsToPrompts` / `fieldsToOptions` / `resolveAnswers` (including required-missing errors, checkbox CSV coercion, `when`).
- `ast/endpoints.test.ts`, `ast/routes.test.ts`, `ast/router.test.ts` — insertion, idempotency, protected/public, category creation.
- `preflight.test.ts` — which files get scaffolded given config + actions.
- Engine dry-run/force cases added to `engine.test.ts`.

**E2E (`tests/e2e/`, throwaway temp-dir fixtures, spawns the built CLI, asserts files + exit codes):**
- `empty-project.test.ts` — no config → guided error, non-zero exit, no files written.
- `non-interactive.test.ts` — every generator run via flags with `--yes`.
- `force-and-dryrun.test.ts` — skip vs overwrite vs preview (no writes on dry-run).
- `scaffold.test.ts` — missing `ApiEndpoints.ts` auto-created, endpoint then registered.
- `feature-e2e.test.ts` — full chain incl. endpoint + route registration.
- `doctor.test.ts` — readiness reporting and `--fix`.

E2E requires a build step before running; add a `test:e2e` script and a fixture helper that spins up a minimal project in `os.tmpdir()`.

### 9. Integrate into the consuming app

Once shipped, in `starter-template-react-vite`:
- Install/link `@appswave/rq-codegen`.
- Run `rq-codegen doctor` (and `--fix` if needed).
- Add scripts, e.g.:
  ```jsonc
  "dto:gen":     "rq-codegen types-dto --name",       // npm run dto:gen -- Product
  "feature:gen": "rq-codegen feature --yes --name"
  ```

## Implementation phases

1. **Field-schema foundation + CLI subcommands + non-interactive.** Introduces `fields.ts`, migrates generators to `fields`, restructures `cli.ts`, adds global flags. **Unblocks the primary goal.**
2. **Engine dry-run/force + preflight/scaffold + `doctor`.**
3. **ts-morph AST mutation rewrite** (`src/core/ast/`), replacing regex logic in `actions.ts`.
4. **`feature` fix + consistency cleanups** (helpers dedupe, version from package.json, `list`).
5. **Test matrix** (unit + E2E).
6. **Integrate into the app** (`package.json` scripts + `doctor`).

Each phase leaves the tool releasable; existing 285 unit tests must stay green throughout.

## Non-goals

- No template redesign or new generators.
- No plugin system for third-party generators.
- No migration of existing generated code in consuming projects.
- No watch mode.

## Risks / open notes

- **ts-morph** is a non-trivial dependency; acceptable for a tool that edits real source. Confined to `src/core/ast/`.
- **Router/routes auto-scaffolding** is opinionated (§4); flagged with a runtime note. Can be switched to fail-with-guidance if the generated shape conflicts with real projects.
- **E2E build dependency**: E2E tests run against `dist/`, so CI must build first.
