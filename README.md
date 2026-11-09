# React and Node bug fixes: before, after, regression tests

Three deliberately broken examples and their fixes. These are **synthetic demonstrations**, not client projects. Start with the React search case: a slow earlier response replaces the result of a newer search.

## Example: the wrong search result wins

1. Search for `alpha`, then `beta`.
2. The `beta` response arrives first and appears on screen.
3. The older `alpha` response arrives late.

**Before:** the screen switches back to Alpha. **After:** Beta stays visible. A late error from Alpha is ignored too; clearing the query leaves the empty state visible.

The fix guards both promise callbacks with the effect's active flag. Cleanup marks the earlier effect inactive. It ignores superseded work; it does not abort the underlying request.

Compare [before/search.cjs](before/search.cjs) and [after/search.cjs](after/search.cjs). The [React regression tests](test/search.test.cjs) control response order and render the component in jsdom.

## Two Node examples

| Case | Broken behavior | Fixed behavior | Evidence |
|---|---|---|---|
| Quote validation | Accepts invalid quantity types or ranges | Validates shape, integer quantity and range; prices come from the server | HTTP checks for valid totals, invalid input, unknown SKU, malformed and oversized JSON |
| User-scoped projects | One fixture user can read or edit another's project | Read, update and list lookups are scoped to the fixture user | HTTP checks for own access, rejected cross-user access and unchanged records |

Compare [before/api.cjs](before/api.cjs) with [after/api.cjs](after/api.cjs); tests are in [test/api.test.cjs](test/api.test.cjs).

`x-demo-user` is a synthetic stand-in for an authenticated session, **not production authentication**. These examples do not establish database row-level security, deployment readiness or a full security audit. React checks use jsdom, not visual browser testing.

## Run the checks

Use Node 18+ in a disposable environment. Install the locked dependencies with lifecycle scripts disabled:

```sh
npm ci --ignore-scripts --no-audit --no-fund
DEMO_VARIANT=before node --test test/*.test.cjs
DEMO_VARIANT=after node --test test/*.test.cjs
```

The before run intentionally exits with a failure. Recorded on October 29, 2026 in a network-isolated Ubuntu VM: **before 3 passed / 6 failed; after 9 passed / 0 failed**. This publication uses those unchanged source files and tests. These are capability checks, not customer results.

## Provenance and licenses

Adapted from the MIT-licensed [Vite React template](https://github.com/vitejs/vite/tree/cce559ab158cc6b177d0911a0bea73436b48faff/packages/create-vite/template-react) and [Express web-service example](https://github.com/expressjs/express/blob/1c6f1b0fe4000977b9a7b4f34097e4d527dd9824/examples/web-service/index.js). Original snapshots and their copyright notices are retained in [upstream/](upstream/). The synthetic routes, faults, fixes and regression tests were added for this demonstration; these are not reported upstream bugs. No client data or credentials are included.

## Need one bug fixed?

[One React or Node source-code fix on Upwork](https://www.upwork.com/services/product/2115776119531957640): USD49, three days, one revision. Send reproduction steps in Upwork messages before sharing private source; AI processing requires your consent. Scope is agreed before work starts; you apply the delivered change.
