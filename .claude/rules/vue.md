---
paths: ["src/client/**/*.vue"]
---

# Vue Component Conventions

## Script

Always use `<script setup lang="ts">`. Never use Options API (`defineComponent`, `data()`, `methods`).

## Props and emits

Use the generic form — not object syntax, not string arrays:

```ts
// Props
defineProps<{ title: string; year: number }>()

// Props with defaults
withDefaults(defineProps<{ year?: number }>(), { year: 2024 })

// Emits
defineEmits<{ close: []; actorClick: [name: string] }>()
```

## Block order

Always in this order: `<script>` → `<template>` → `<style scoped>`

## Template rules

- `v-for` always paired with `:key`
- No direct DOM manipulation — use `ref()` and template refs

## Importing

- Composables: `../../composables/useXxx` (never inline logic in components)
- API calls: only via `../lib/api.ts` helpers (`get`, `post`, `put`, `del`) — never raw `fetch`
- Types: from `../lib/types.ts`
