---
paths: ["src/client/composables/*.ts"]
---

# Composable Conventions

## Module-level singleton pattern

State `ref`s are declared **outside** the composable function, at module scope. This makes all callers share the same reactive state — intentional for app-wide singletons.

```ts
const titles = ref<Title[]>([]);       // shared across all callers

export function useTitles() {
  // functions close over the shared ref
  return { titles, fetchTitles }
}
```

Do NOT declare refs inside the function body unless the composable is meant to be instance-scoped (like `useFilter`).

## Naming and exports

- File: `useMyFeature.ts`
- Export: `export function useMyFeature() { ... }` — named export, not default
- Return: all refs and all functions

## Imports

- API calls: `import { get, post, put, del } from "../lib/api"` — never raw `fetch`
- Types: `import type { Foo } from "../lib/types"`
- Vue: `import { ref, computed } from "vue"`

## Mutation → re-fetch pattern

After any write, always re-fetch to keep module-level state in sync:

```ts
async function addTitle(title: string, year: number) {
  await post("/titles", { title, year });
  await fetchTitles();   // re-fetch, never mutate the array directly
}
```

## Race condition guard

For async loads that can be cancelled or superseded, use an incrementing token:

```ts
let requestToken = 0;

async function load(id: number) {
  const token = ++requestToken;
  const data = await get<Foo>(`/foo/${id}`);
  if (token === requestToken) {
    state.value = data;   // discard stale responses
  }
}

function clear() {
  requestToken++;         // invalidate in-flight request without awaiting
  state.value = null;
}
```

## Generic / utility composables

Composables that take arguments (like `useFilter`) are instance-scoped — refs go inside the function. Always use `Ref<T>` input parameters rather than raw values so callers can pass reactive state.

```ts
export function useFilter<T>(items: Ref<T[]>, keyFn: (item: T) => string) {
  const query = ref("");
  const filtered = computed(() => { ... });
  return { query, filtered };
}
```
