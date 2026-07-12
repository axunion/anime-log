---
paths: ["**/*.test.ts"]
---

# Testing Conventions

## Two test environments, one vitest run

- **`pnpm test`** — runs both projects in a single `vitest run`
- **`pnpm test:client`** — composables and `lib/api.ts` tests only (`--project client`; happy-dom)
- **`pnpm test:server`** — Hono routes and middleware tests only (`--project server`; `@cloudflare/vitest-pool-workers` / Miniflare)

Config files:
- `vitest.config.ts` — root config; lists the two projects below via `test.projects`
- `vitest.client.config.ts` — client project
- `vitest.workers.config.ts` — server project (uses `cloudflareTest` plugin)

## Server test patterns

```ts
/// <reference types="@cloudflare/vitest-pool-workers/types" />
import { env } from "cloudflare:test";
const typedEnv = env as unknown as Bindings;

beforeEach(async () => {
  await applySchema(typedEnv.DB); // creates tables + clears all data
});
```

- `applySchema` from `test/helpers/d1.ts` — creates tables (IF NOT EXISTS) then deletes all rows to reset state
- `seedTitle`, `seedCast`, `seedHistory` from `test/helpers/d1.ts` — minimal seeding helpers
- `callApp` from `test/helpers/app.ts` — wraps `app.fetch` with `auth: true/false` convenience

## Client test patterns

- Mock `../lib/api.ts` with `vi.mock` + `vi.hoisted` for mock functions referenced in the factory
- Reset module-level `ref` singletons in `beforeEach` (composables use module-level state)
- Mock `fetch` and `localStorage` with `vi.stubGlobal`; call `mockFetch.mockClear()` in `beforeEach`

## What to test / skip

| Area | Coverage |
|---|---|
| `useFilter.ts` | All logic including regex metacharacter behavior |
| `useHistory.reorder` | Boundary conditions (first up / last down = no-op) |
| `lib/api.ts` | Auth header presence/absence for each method |
| Server routes | Full CRUD via `callApp` + Miniflare D1 |
| Vue components | Skip (logic lives in composables) |
| `scripts/seed-local.ts` | Skip (one-off dev script) |
| UNIQUE constraint → 409 | `POST /api/titles` and `PATCH /api/titles/:id` with duplicate name; `onError` checks `err.cause` chain for DrizzleQueryError wrapping |
| `src/server/index.ts` | Security headers (nosniff/DENY/HSTS/Referrer-Policy/X-Robots-Tag), admin concealment (`/admin.html` etc. → 404), `/:secret` guard in test env, notFound JSON 404 for `/api/*` |
| `useDataPortability.ts` | `onImport`: missing-file guard, confirm cancel, data-success/history-fail partial error, full success (modal close + re-fetch); `readJson`: invalid JSON and FileReader IO error; `exportData`: fetch failure + `exporting` flag cleanup |
| `useCastView.ts` | `loadCast` failure clears `selectedDetail` when current, does not clear when stale; `loadVoice` failure is silent discard |
| `useHistory.ts` | `persistOrder` failure: `fetchHistory` called to restore order + re-throw; `addHistory` success: write→re-fetch; write failure: error set + re-throw, no re-fetch |

## Mocking FileReader in client tests

`FileReader` is used as a constructor (`new FileReader()`). Use a class (not `vi.fn()`) as the stub to avoid the "not a constructor" error:

```ts
function makeFileReaderClass(opts: { content?: string; error?: boolean }) {
  return class MockFileReader {
    result = opts.content ?? null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readAsText() {
      // Defer so onload/onerror are assigned before firing.
      Promise.resolve().then(() => {
        if (opts.error) this.onerror?.();
        else this.onload?.();
      });
    }
  };
}

vi.stubGlobal("FileReader", makeFileReaderClass({ content: "[]" }));
// Restore in afterEach:
vi.unstubAllGlobals();
```

## onError UNIQUE constraint detection

`onError` in `src/server/index.ts` checks for `"UNIQUE constraint failed"` in both `err.message` and `err.cause.message`. This covers both raw D1 errors (message on the error itself) and `DrizzleQueryError` which wraps the D1 error in `.cause`.
