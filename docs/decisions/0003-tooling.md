# 0003: Tooling and repo standards

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, PM)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** specs/00-foundations.md

## Context
There's no git, tests, CI or licence. The typecheck fails (TS5107), there's no `exports` map, and two TypeScript packages are installed.

## Research
| Reference | What they do | Adopt / adapt / reject | Why |
|---|---|---|---|
| tsdown | Library bundler with built-in publint and attw checks | Adopt (replaces tsup) | Packaging checks run as part of the build |
| publint / arethetypeswrong | Validate `exports` and type resolution, often in CI | Adopt | Catches H8-type mistakes |
| Vitest browser mode (Playwright) | Real-browser component tests | Adopt | The overlay is all DOM, so jsdom can't measure layout |
| Changesets | Versioning and changelog from PRs | Adopt | Standard for OSS libraries |

Sources: [tsdown lint options](https://tsdown.dev/options/lint), [arethetypeswrong](https://github.com/remcohaszing/arethetypeswrong.github.io).

## Decision
Git with `main` and PR flow. pnpm. TypeScript strict with `moduleResolution: bundler`. tsdown building ESM plus `.d.ts`, with an `exports` map (types first). Vitest unit tests plus browser mode. Biome for lint and format. A Vite playground in `playground/`. GitHub Actions running typecheck, lint, test, build and publint/attw. Changesets. MIT licence. ESM-only (assumption: CJS consumers of a dev tool are rare; revisit if someone asks).

## Consequences
More setup before any feature work, but every later spec gets real checks. ESM-only rules out `require()`.
