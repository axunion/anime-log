---
name: anime-log-feature
description: >
  Use this skill whenever adding a new feature, data entity, or CRUD resource to the anime-log project.
  Triggers when the user says things like "add a [noun] feature", "implement [X] tracking", "create a new
  page for [X]", "add [X] to the app", or asks to extend the app with new functionality.
  This skill coordinates the full-stack workflow across four focused sub-skills — use it as the entry point
  whenever a new data entity touches multiple layers of the stack.
---

# anime-log Full-Stack Feature Orchestrator

This project is **Cloudflare Workers + D1 + Hono** backend with a **Vue 3 MPA** frontend.
A new data entity typically touches all four layers below. Work through the sub-skills in order.

## When to use this skill vs. the sub-skills directly

| Task | Use |
|---|---|
| Complete new feature (new table + API + UI) | This skill (orchestrator) |
| Schema change only | `migrate` skill |
| API route addition only | `server-feature` skill |
| Vue component/composable only | `client-feature` skill |

---

## Step 1 — Schema: `migrate` skill

Invoke the **`migrate`** skill to create and apply the D1 migration.

The migration file goes in `migrations/` as `NNNN_<name>.sql`. After applying locally with
`pnpm db:migrate`, confirm the table appears before moving on.

---

## Step 2 — Server: `server-feature` skill

Invoke the **`server-feature`** skill to add the Hono route and TypeScript types.

This creates `src/server/routes/<name>.ts`, mounts it in `src/server/index.ts`, and adds
the corresponding type to `src/client/lib/types.ts`.

---

## Step 3 — Client: `client-feature` skill

Invoke the **`client-feature`** skill to add the Vue composable and component.

This creates `src/client/composables/use<Name>.ts` and the component in either
`viewer/components/` or `admin/components/`, then wires it into the relevant `App.vue`.

---

## Final Checklist

Before marking the feature complete:

- [ ] Migration applied (`pnpm db:migrate` succeeded)
- [ ] Route mounted in `src/server/index.ts`
- [ ] Write endpoints all use `authMiddleware`
- [ ] Types added to `src/client/lib/types.ts`
- [ ] Composable and component created and wired into `App.vue`
- [ ] `pnpm dev` runs without errors, feature works end-to-end
- [ ] If deploying: run `pnpm db:migrate:remote` before `pnpm deploy`
