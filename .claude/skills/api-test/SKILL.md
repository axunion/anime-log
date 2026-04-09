---
name: api-test
description: >
  Test API endpoints against the local dev server using curl. Use this skill when the user says
  "/api-test", "test the API", "try the endpoint", "verify the route works", "check if the API
  returns", or wants to confirm HTTP behavior of any route. Always use this skill instead of
  writing ad-hoc curl commands — it ensures consistent headers and token handling.
---

# API Endpoint Tester

The dev server runs at `http://localhost:5173`. All API routes are under `/api/`.

## Step 1: Check the dev server is running

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/api/titles
```

If this returns `000` or a connection error, stop and tell the user:
> The dev server is not running. Start it with `pnpm dev` in another terminal, then retry.

## Step 2: Run the tests

### Read endpoints (no auth needed)

```bash
# List all titles
curl -s http://localhost:5173/api/titles | head -c 1000

# Get a single title with cast
curl -s http://localhost:5173/api/titles/1

# Voice actor search
curl -s "http://localhost:5173/api/cast?actor=NAME"

# History list
curl -s http://localhost:5173/api/history
```

### Write endpoints (Bearer token required)

Ask the user for their `API_TOKEN` if not already known in this session. The token is stored
as a Cloudflare secret (`wrangler secret put API_TOKEN`) and also available locally via `.dev.vars`.

```bash
TOKEN="paste-token-here"

# Create a title
curl -s -X POST http://localhost:5173/api/titles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Test Title","year":2024}'

# Update a title
curl -s -X PUT http://localhost:5173/api/titles/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"year":2025}'

# Delete a title
curl -s -X DELETE http://localhost:5173/api/titles/1 \
  -H "Authorization: Bearer $TOKEN"

# Reorder history
curl -s -X PUT http://localhost:5173/api/history/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"ids":[3,1,2]}'
```

## Step 3: Report results

For each request, show:
- HTTP status code
- Response body (truncated to ~500 chars if large)

Common issues to call out:
- `401 Unauthorized` → token is missing or wrong
- `404 Not Found` → check the ID exists or route is mounted in `src/server/index.ts`
- `500 Internal Server Error` → check the Hono route for SQL errors (look at the worker logs in the terminal running `pnpm dev`)
- Empty response on POST → the route may be missing `RETURNING id`

After any POST or DELETE test, follow up with a GET to confirm the state changed correctly.
