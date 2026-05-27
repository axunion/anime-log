---
name: client-feature
description: >
  Add a Vue composable and Vue component to the anime-log client. Use this skill when the user
  says "add a Vue component", "implement the frontend for [X]", "add the UI for [X]", "create
  a composable for [X]", or when a new feature needs frontend implementation. Also triggered as
  part of the full-stack anime-log-feature workflow (after the server-feature skill).
---

# Client Feature — Vue Composable + Vue Component

This covers Layer 4 (Vue composable) and Layer 5 (Vue component) of the anime-log stack.
The project is a **Vue 3 MPA** with two independent apps: `viewer` (read-only) and `admin` (CRUD).

## Layer 4: Vue Composable

Create `src/client/composables/useMyFeature.ts`.

**The module-level singleton pattern** (all existing composables use this):

```typescript
import { ref } from "vue";
import { del, get, patch, post } from "../lib/api";
import type { MyItem } from "@shared/types";

// Module-level refs — shared across all component instances
const items = ref<MyItem[]>([]);
const error = ref<Error | null>(null);
const loading = ref(false);

export function useMyFeature() {
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

  async function addItem(payload: { some_text: string }) {
    await post("/my", payload);
    await fetchItems();  // re-fetch, never mutate the array directly
  }

  async function updateItem(id: number, payload: { some_text?: string }) {
    await patch(`/my/${id}`, payload);  // PATCH for partial updates
    await fetchItems();
  }

  async function deleteItem(id: number) {
    await del(`/my/${id}`);
    await fetchItems();
  }

  return { items, error, loading, fetchItems, addItem, updateItem, deleteItem };
}
```

**API helpers (`src/client/lib/api.ts`):**
- `get<T>(path)` — unauthenticated
- `post(path, body)` / `patch(path, body)` / `del(path)` — attach Bearer token from `useAuth`
- Use `patch` for partial updates (PATCH), not `put`. Use `put` only for full-replacement operations (reorder).

**Types:**
- Always import from `@shared/types` — never from `../lib/types` (that file no longer exists)

### Viewer vs admin split (for complex features)

If the feature needs different behavior in viewer (read-only) and admin (CRUD), split into two composables:

- `useMyFeatureView.ts` — module-level singleton state + load functions + race guard (viewer)
- `useMyFeatureEdit.ts` — write operations only, no module-level state (admin)

**Race guard** (for loads that can be superseded):
```typescript
import { createRaceToken } from "../lib/raceToken";

const race = createRaceToken();

async function load(id: number) {
  const token = race.next();
  const data = await get<Foo>(`/my/${id}`);
  if (token !== race.current()) return;
  state.value = data;
}

function clear() {
  race.invalidate();
  state.value = null;
}
```

---

## Layer 5: Vue Component

Decide whether the feature belongs in **viewer** (read-only) or **admin** (CRUD), then create the component.

**Viewer component** (`src/client/viewer/components/MyPanel.vue`):
```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useMyFeature } from "../../composables/useMyFeature";

const { items, fetchItems } = useMyFeature();
onMounted(fetchItems);
</script>

<template>
  <div class="my-panel">
    <div v-for="item in items" :key="item.id">
      {{ item.some_text }}
    </div>
  </div>
</template>
```

**Admin component** (`src/client/admin/components/MyManager.vue`):
- Include add/update/delete controls
- Call composable functions for all mutations
- Use `useConfirm()` for destructive actions (never `window.confirm`)
- Authentication uses the secret URL (`/<API_TOKEN>`) — no per-component auth check needed; `App.vue` renders unconditionally

**Wiring up:** Import and register the component in the relevant `App.vue`.
- Viewer `App.vue` composes `useTitles`, `useCastView`, `useHistory` — add your composable here
- Admin `App.vue` follows the same pattern; mount your component inside the existing layout

---

## Checklist

- [ ] Composable created in `src/client/composables/`
- [ ] Types imported from `@shared/types` (not `../lib/types`)
- [ ] `error` and `loading` refs exposed in composable return
- [ ] Write operations use `patch` for partial updates
- [ ] Component created in the correct app directory (`viewer/` or `admin/`)
- [ ] Component imported and used in the relevant `App.vue`
- [ ] `onMounted` calls fetch in viewer components
- [ ] Test: `pnpm dev` runs without errors, feature renders correctly
