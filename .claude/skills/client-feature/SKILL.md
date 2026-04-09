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
import { del, get, post, put } from "../lib/api";
import type { MyItem } from "../lib/types";

// Module-level ref — shared across all component instances without prop drilling
const items = ref<MyItem[]>([]);

export function useMyFeature() {
  async function fetchItems() {
    items.value = await get<MyItem[]>("/my");
  }

  async function addItem(payload: { some_text: string }) {
    await post("/my", payload);
    await fetchItems();
  }

  async function deleteItem(id: number) {
    await del(`/my/${id}`);
    await fetchItems();
  }

  return { items, fetchItems, addItem, deleteItem };
}
```

**API helpers (`src/client/lib/api.ts`):**
- `get<T>(path)` — unauthenticated
- `post(path, body)` / `put(path, body)` / `del(path)` — attach Bearer token from `localStorage`

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
- Include add/delete controls
- Call `addItem` / `deleteItem` from the composable
- Show the token prompt via `AdminHeader` if needed

**Wiring up:** Import and register the component in the relevant `App.vue`.
- Viewer `App.vue` composes `useTitles`, `useCast`, `useHistory` — add your composable here
- Admin `App.vue` follows the same pattern

---

## Checklist

- [ ] Composable created in `src/client/composables/`
- [ ] Component created in the correct app directory (`viewer/` or `admin/`)
- [ ] Component imported and used in the relevant `App.vue`
- [ ] `onMounted` calls fetch in viewer components
- [ ] Test: `pnpm dev` runs without errors, feature renders correctly
