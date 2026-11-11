# 0004: Production exclusion is the consumer's job

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Tech Lead, Frontend)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:** specs/00-foundations.md

## Context

The wrappers read `process.env.NODE_ENV` in browser code (C5). That crashes or misbehaves outside bundlers that replace it.

## Research

| Reference                  | What they do                                         | Adopt / adapt / reject | Why                                                                             |
| -------------------------- | ---------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| React Scan                 | Installed as a dev dependency, and the user gates it | Adopt                  | No env magic inside the library                                                 |
| Vite `import.meta.env.DEV` | Lets the bundler remove dead branches                | Adopt in our docs      | A dynamic import inside a dev-only branch is removed from the production bundle |

## Decision

The library never reads env. The README documents one pattern per bundler (Vite, Next.js, webpack): `if (import.meta.env.DEV) import('figma-grid-audit').then(m => m.createGridOverlay(...))`. The playground's build test asserts that the production bundle contains no package code.

## Consequences

One extra line for users, in exchange for zero runtime risk and a guarantee that is actually tested.
