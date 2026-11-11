# 0008: Rename the product and package (no "Figma" in the name)

- **Status:** Approved
- **Proposed:** 2026-11-11 by the product team (roles: Product, Copy, Tech Lead)
- **Approved:** 2026-11-11 by Flovet
- **Supersedes:** none
- **Specs:**

## Context

We're about to publish to npm, where a published name can't really be taken back: an unpublished version number can never be reused, and unpublishing is only allowed for 72 hours (or later in a few narrow cases). The working name, "Figma Grid Audit" (`figma-grid-audit`), puts Figma's trademark into our product name. The design brief already says we never claim to be affiliated with Figma (§5).

## Research

| Reference                  | What it says or does                                                                                                                                                                                   | Adopt / adapt / reject                         | Why                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Figma trademark guidelines | Third parties may say a product works with or is built for Figma, but the product's name must not include "Figma". Their example: "Tom's plugin for Figma design" is fine; "Tom's Figma plugin" is not | **Adopt**                                      | The rule is explicit, and Figma enforces it (it sent a letter over the term "Dev Mode") |
| Figma Community guidelines | Company names, domains and handles must not contain Figma's name or any part of it ("Figdesigns" is the example of what's not allowed)                                                                 | **Adopt**                                      | So no "Fig-" names either                                                               |
| npm unpublish policy       | Registry data is immutable; unpublishing is allowed within 72 hours; a name@version pair is never reusable                                                                                             | **Adopt**: rename **before** the first publish | Renaming later means a deprecated package and a confusing history                       |

Sources: [Figma trademark guidelines](https://www.figma.com/using-the-figma-brand/) (search summary), [Figma Community guidelines](https://help.figma.com/hc/en-us/articles/360038510573) (search summary), [Verge report on the "Dev Mode" letter](https://hn.jakechampion.name/reader/https://www.theverge.com/news/649851/figma-dev-mode-trademark-loveable-dispute) (search summary), [npm unpublish policy](https://docs.npmjs.com/policies/unpublish/) (search summary). Summaries only; not legal advice. A lawyer should confirm before any commercial use.

## Options

Every name below was checked on 2026-11-11 against **npm** (`npm view`), **GitHub** (repository search, top results by stars) and **the web** (search for the name as a product or company).

| Name                                                   | npm                                                       | GitHub                                                                                           | Web                                                           | Verdict                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Grid Auditor** (`grid-auditor`), Flovet's suggestion | free (`gridauditor`, `grid-audit`, `gridaudit` also free) | `grid-auditor`: 9 tiny repos with 0 stars (energy and "grid-down" projects); `gridauditor`: none | no product; nearest uses are energy-grid compliance audits    | **Clean.** Plain and descriptive, close to the working name. Search results mix in energy-grid audits |
| **Gutterline** (`gutterline`)                          | free                                                      | 6 tiny repos (top: 12 stars, unrelated)                                                          | no product by that name                                       | **Clean.** Recommended                                                                                |
| **Gridlet** (`gridlet`)                                | free                                                      | 13 repos (top: 10 stars)                                                                         | no product                                                    | Clean                                                                                                 |
| **Gridkin** (`gridkin`)                                | free                                                      | 16 repos (top: 0 stars)                                                                          | no product, but **Gridnik** is an Adobe XD layout-grid plugin | Clean, with a look-alike in our space                                                                 |
| Gridmatch                                              | free                                                      | 15 small repos                                                                                   | a **GRIDMATCHER** trademark for software services             | Risky                                                                                                 |
| Pocket Grid (`pocketgrid`)                             | free                                                      | **arnaudleray/pocketgrid**, ~320 stars                                                           | a well-known CSS grid framework                               | Clashes in our space                                                                                  |
| GridPocket                                             | free                                                      | `gridpocket` organisation                                                                        | **GridPocket SAS**, a French energy-software company          | Taken                                                                                                 |
| Trueline                                               | free                                                      | petobens/trueline, ~400 stars                                                                    | a bash prompt tool                                            | Taken                                                                                                 |
| SnapGrid                                               | free                                                      | gustavscirulis/snapgrid, ~120 stars                                                              | an existing app                                               | Taken                                                                                                 |
| Gridwise                                               | free                                                      | 284 repos                                                                                        | many uses                                                     | Too crowded                                                                                           |
| Plumbline, Overgrid, Gridsy, Onthegrid                 | **taken** on npm                                          | not checked                                                                                      | not checked                                                   | Out                                                                                                   |
| gridparity, ongrid, gridcheck (earlier ideas)          | free                                                      | not checked                                                                                      | not checked                                                   | Not fully checked                                                                                     |
| Keep `figma-grid-audit`                                | free                                                      | ours                                                                                             | goes against Figma's guidelines                               | Out                                                                                                   |

Why **Gutterline**: a gutter is the exact Figma layout-grid term (the space between columns), and "line" covers the guides and rulers. It names the craft without naming Figma, and it's distinctive enough to search for.

## Decision

**Grid Auditor**, package `grid-auditor` (chosen by Flovet). So:

- The package, repo, README title, custom element (`<figma-grid-audit>` → `<grid-auditor>`), the console prefix and the `MARKER` all change to the new name.
- The README and npm description say "for Figma layout grids" (allowed descriptive use), and add the line "Not affiliated with or endorsed by Figma."
- The GitHub repo is renamed too (GitHub redirects the old URL).

## Consequences

- A rename touches docs, code and tests in one PR, before spec 03 publishes anything.
- The project brief's title and product line change, which needs this decision approved.
