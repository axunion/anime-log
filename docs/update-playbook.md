# Update Playbook

Step-by-step recipes for the changes this project actually needs. Each recipe lists
the files to touch, in order. Config files not mentioned here (tsconfig.*, vite.config.ts,
wrangler.toml, biome.json) almost never need changes — treat them as frozen infrastructure.

## Add a column to an existing table

1. `src/server/db/schema.ts` — add the column to the table definition
2. `pnpm db:generate` — creates a migration under `migrations/`
3. `pnpm db:migrate` — applies it to the local D1
4. `src/shared/types.ts` — add the field to the API response type if it is exposed
5. `src/server/routes/*.ts` — include the column in SELECT/INSERT/UPDATE as needed
   (zod input schemas come from `createInsertSchema` and pick up the column automatically)
6. `src/client/composables/*.ts` + components — consume the new field
7. Update the matching `*.test.ts` files (server route test + composable test)

Production migration is applied by the Deploy workflow — never run `--remote` locally.

## Add a new API endpoint

1. Pick the route module in `src/server/routes/` (or create one and mount it in
   `src/server/index.ts`)
2. Follow `.claude/rules/server.md`: `idParam.parse()` for path params, existence
   check → 404 for PATCH/DELETE, `authMiddleware` on writes
3. `src/shared/types.ts` — add/extend the response type
4. `src/client/lib/api.ts` is generic — no change needed; call it from a composable
5. Add a route test in `src/server/routes/*.test.ts` using `callApp` from
   `test/helpers/app.ts`

## Change UI behavior or appearance

- Logic lives in `src/client/composables/` (tested); markup and styles live in the
  `.vue` components (not tested — keep logic out of them)
- Viewer page: `src/client/viewer/`, admin page: `src/client/admin/`, shared
  components: `src/client/components/`
- Follow `.claude/rules/vue.md` and `.claude/rules/composables.md`

## Reset and reseed the local database

```bash
pnpm db:reset        # wipe local D1 + re-apply all migrations
pnpm dev             # separate terminal
pnpm seed:local      # loads data/data.{json,js} + data/history.{json,js}
```

Or restore from an Admin UI export: Import button → select `data.json` +
`history.json` → confirm.

## Deploy to production

1. Push to `main` (CI runs `pnpm check` + `pnpm test`)
2. GitHub → Actions → Deploy → Run workflow with `dry_run=true` to verify
3. Re-run with `dry_run=false` for the real deploy

Never deploy from local — see the production safety rule in `CLAUDE.md`.

## Before committing

CI is the safety net (no git hooks). Run locally first:

```bash
pnpm fix     # Biome auto-fix
pnpm check   # lint + typecheck
pnpm test    # all tests (single vitest run, client + server projects)
```
