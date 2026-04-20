# Testing Conventions

## Two test environments

- **`pnpm test:client`** — composables and `lib/api.ts` tests (Vitest, happy-dom)
- **`pnpm test:server`** — Hono routes and middleware tests (Vitest + `@cloudflare/vitest-pool-workers` / Miniflare)
- **`pnpm test`** — runs both in sequence

Config files:
- `vitest.config.ts` — client tests
- `vitest.workers.config.ts` — server tests (uses `cloudflareTest` plugin)

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
| `scripts/migrate.ts` | Skip (one-off dev script) |
