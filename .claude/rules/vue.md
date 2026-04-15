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

## Admin CRUD add forms

All admin sections that support adding items must place the add form at the top of the section, directly after `<h2 class="admin-section-title">`. Use `<form class="admin-form" @submit.prevent="onAdd">` with inline inputs and a submit button. Never place the primary add UI at the bottom of a list.
