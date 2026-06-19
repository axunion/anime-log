---
paths: ["src/client/composables/*.ts"]
---

# Composable Conventions

## Module-level singleton pattern

State `ref`s are declared **outside** the composable function, at module scope. This makes all callers share the same reactive state — intentional for app-wide singletons.

```ts
const titles = ref<Title[]>([]);       // shared across all callers
const error = ref<Error | null>(null);
const loading = ref(false);

export function useTitles() {
  // functions close over the shared refs
  return { titles, error, loading, fetchTitles }
}
```

Do NOT declare refs inside the function body unless the composable is meant to be instance-scoped (like `useFilter`).

## Naming and exports

- File: `useMyFeature.ts`
- Export: `export function useMyFeature() { ... }` — named export, not default
- Return: all refs and all functions

## Imports

- API calls: `import { del, get, patch, post } from "../lib/api"` — never raw `fetch`
- Types: `import type { Foo } from "@shared/types"` — always from `@shared/types`, never from `../lib/types`
- Vue: `import { ref, computed } from "vue"`

## Standard state shape

Every data-fetching composable exposes:

```ts
const items = ref<MyItem[]>([]);
const error = ref<Error | null>(null);
const loading = ref(false);

async function fetchItems() {
  loading.value = true;
  error.value = null;
  try {
    items.value = await get<MyItem[]>("/my");
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(String(err));
  } finally {
    loading.value = false;
  }
}
```

## Mutation → re-fetch pattern

After any write, always re-fetch to keep module-level state in sync. Extract a `mutate()` helper inside the composable to avoid repeating the error-normalisation and re-throw logic. `fetchXxx` itself catches and does not re-throw, so the catch only fires for the write.

```ts
async function mutate(op: () => Promise<unknown>) {
  try {
    await op();
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(String(err));
    throw err;            // re-throw so components can react to failures
  }
}

async function addItem(payload: { some_text: string }) {
  await mutate(async () => {
    await post("/my", payload);
    await fetchItems();   // re-fetch, never mutate the array directly
  });
}
```

Callers that perform cleanup on success (e.g. clearing a form) must wrap the call in try/catch and return early on failure:

```ts
async function onAdd() {
  try {
    await addItem(payload);
  } catch {
    return; // error shown via App.vue banner; don't clear the form
  }
  // clear form fields here
}
```

Callers that only display errors via the App.vue banner (no cleanup) may omit the try/catch, but template-bound event handlers (`@click="someAction"`) that call re-throwing mutations must still wrap to prevent unhandled rejections.

For partial updates, use `patch()` not `put()`. Use `put()` only for full-replacement operations (e.g. reorder endpoints that replace the entire ordered set).

## Known intentional deviations

**`useCastEdit` — caller-synced, no re-fetch**: `useCastEdit` write operations (add, update, delete, replace cast) do not call `loadCast` after each write. Instead the caller (`CastEditor.vue`) rebuilds `savedRows` locally from the PATCH/PUT response. This is a deliberate split to keep cast write operations side-effect-free. If you add a new caller, ensure it re-fetches via `useCastView.loadCast` after any mutation.

**`useAuth` — non-reactive token**: `useAuth.token` is a plain `let` (not a `ref`). The token is injected via `<meta name="x-api-token">` and set via `setToken()` in `admin/main.ts` **before** the Vue app mounts. No component reads the token reactively, so a `ref` is unnecessary. If a future feature needs to display or react to the token, convert to `ref` at that point.

## Race condition guard

For async loads that can be cancelled or superseded, use `createRaceToken()` from `../lib/raceToken`:

```ts
import { createRaceToken } from "../lib/raceToken";

const race = createRaceToken();

async function load(id: number) {
  const token = race.next();
  const data = await get<Foo>(`/foo/${id}`);
  if (token !== race.current()) return;   // discard stale responses
  state.value = data;
}

function clear() {
  race.invalidate();   // invalidate in-flight request without awaiting
  state.value = null;
}
```

## Viewer vs admin composable split

When a composable serves fundamentally different needs in viewer and admin, split into two files:

- `useFooView.ts` — viewer-only: read state, load functions, race guard, module-level singleton state
- `useFooEdit.ts` — admin-only: write operations (add, update, delete, replace) — pure functions, no module-level state

Keep `useFoo.ts` as a compat shim only if other code imports it, re-exporting from both split composables.

## Generic / utility composables

Composables that take arguments (like `useFilter`) are instance-scoped — refs go inside the function. Always use `Ref<T>` input parameters rather than raw values so callers can pass reactive state.

```ts
export function useFilter<T>(items: Ref<T[]>, keyFn: (item: T) => string) {
  const query = ref("");
  const filtered = computed(() => { ... });
  return { query, filtered };
}
```
