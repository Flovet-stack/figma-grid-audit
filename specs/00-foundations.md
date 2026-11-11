# 00: Foundations

Status: Done (local, 2026-11-11; not pushed)

Brief: "Every feature ships with tests" and "Zero production footprint, proved by a test" (Constraints). This spec builds the empty, fully checked base that every later spec builds on. It ships no features.

## Goal

Turn the folder into a clean, version-controlled TypeScript library repo where format, lint, typecheck, tests, build and package checks all pass locally and in CI. Remove the old untested code. When this is done, the package exports one placeholder that does nothing, and every check is green.

## Decisions

Implements 0001, 0003, 0004. (0002 starts in spec 01; this spec only creates the folders it names.)

## Acceptance criteria

### Repo

- [ ] `git init` with `main` as the default branch. The first commit is a snapshot of the folder as it is now, labelled `chore: snapshot before rebuild`, so the old code can always be recovered. Everything else lands in later commits.
- [ ] `.gitignore` covers `node_modules`, `dist`, coverage, the Vitest browser cache, `.env*` and OS files.
- [ ] `LICENSE` (MIT, the current year, the author's name as Flovet sets it) and `package.json` `"license": "MIT"`.
- [ ] `.editorconfig` and `.nvmrc` (Node 24, which is the local version), and `"packageManager"` pinned to the installed pnpm (11.4.0).

### Removal (0001)

- [ ] Deleted: `src/core/ruler.ts`, `guide.ts`, `inspector.ts`, `panel.ts`, `overlay.ts`, `index.ts`, `src/wrappers/`, `public/`, `dist/`, `SOP.md`, `tsup.config.ts` and `package-lock.json`.
- [ ] `src/core/geometry.ts` is deleted too, but the column formula and its `Stretch` case are copied into `docs/notes/legacy-column-formula.md` for spec 01 to refer to.
- [ ] Removed from devDependencies: `tsup`, `@typescript/typescript6`, `@types/react`.

### Tooling (0003)

- [ ] pnpm with `pnpm-lock.yaml`. Every devDependency is pinned to an exact version, using the latest stable release checked at build time (not recalled).
- [ ] TypeScript strict, with `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, and `lib` including `DOM`. No deprecation warnings.
- [ ] tsdown builds `src/index.ts` to ESM plus `.d.ts` in `dist/`, with publint and attw turned on (CI level: error; attw profile: `esm-only`).
- [ ] `package.json`: `"type": "module"`; an `exports` map with `"."` → `{ types, import }` (types first); `"files": ["dist"]`; `"sideEffects": false`; `"engines"`.
- [ ] Biome for lint and format, using the recommended rules. No ESLint or Prettier.
- [ ] Vitest has two projects: `unit` (Node) and `browser` (browser mode, Playwright, Chromium, headless).
- [ ] Changesets is set up (`.changeset/`), with no release in this spec.

### Source skeleton

- [ ] `src/index.ts` exports `export const version: string` (read from package.json at build time or written as a constant) and nothing else.
- [ ] Empty folders, each with a one-line `README.md` saying what goes there: `src/engine/` (pure grid maths, 0002) and `src/overlay/` (shadow-root renderer, 0002).
- [ ] One unit test (`version` is a non-empty string) and one browser test (the module imports in Chromium without touching `document.body` or adding any nodes).

### Playground and production exclusion (0004)

- [ ] `playground/` is a Vite app that is a pnpm workspace package and is not published. It loads the library only inside `if (import.meta.env.DEV) { await import('figma-grid-audit') }`.
- [ ] `pnpm test:prod-exclusion` builds the playground in production mode and fails if any file in its `dist` contains a marker string that the library always includes (for example `__FIGMA_GRID_AUDIT__`).
- [ ] The playground page uses plain CSS (no Tailwind or CDN) and has a centred max-width container with a 12-column CSS Grid. Spec 02 will draw against it.

### Scripts

| Script                         | Does                                    |
| ------------------------------ | --------------------------------------- |
| `pnpm format` / `format:check` | Biome format                            |
| `pnpm lint`                    | Biome lint                              |
| `pnpm typecheck`               | `tsc --noEmit` (library and playground) |
| `pnpm test`                    | Vitest, both projects                   |
| `pnpm build`                   | tsdown, with publint and attw           |
| `pnpm test:prod-exclusion`     | see above                               |
| `pnpm check`                   | all of the above, in order              |
| `pnpm dev`                     | playground dev server                   |

### CI

- [ ] `.github/workflows/ci.yml` runs on pushes to `main` and on PRs, on Ubuntu with the Node version from `.nvmrc`. It caches pnpm, installs Playwright Chromium, then runs `pnpm check`.

### Docs

- [ ] `README.md` is rewritten to be short and honest: what the product is (one line from the brief), a "pre-release, not usable yet" status, the dev-only install pattern from 0004, and the dev commands. No feature claims, and no "ultimate" or "professional" wording.
- [ ] `CLAUDE.md`: the Commands table is filled in.
- [ ] `specs/README.md`: spec 00's status is updated.

## Out of scope

- Any grid maths, overlay rendering, shortcuts or React entry (specs 01 and 02).
- Publishing to npm, creating a GitHub remote, pushing, and branch protection. Ask Flovet first.
- Adding a CJS build.

## Edge cases

- **Windows line endings:** Biome and `.gitattributes` (`* text=auto eol=lf`) must agree, so `format:check` passes on both Windows and CI.
- **Browser binary:** Playwright's browser download must not run on `pnpm install` for consumers. It belongs only in dev and CI scripts.
- **Marker test:** if tsdown's minifier strips the marker, use a value that is exported or has side effects, so a real import keeps it. Prove the test can fail by temporarily importing the library outside the DEV branch.

## Files and patterns to follow

- Folder layout and API names: decision 0002.
- Check commands and AGENTS/CLAUDE style: `side projects/anikansou/CLAUDE.md`.

## Boundaries

- Always: exact versions; every script passes before saying done; show the output.
- Ask first: adding any dependency not listed here; any remote or GitHub action beyond `ci.yml`.
- Never: `git push`, `npm publish`, or reading `process.env` in `src/`.

## Check

- `pnpm check` passes locally from a clean clone (`git clean -xfd && pnpm install && pnpm check`).
- Proof that the production-exclusion test can fail (the temporary bad import makes it red, and reverting it makes it green).
- `git log --oneline` shows the snapshot commit followed by the foundations commits.
- Workflow E review of the diff.
