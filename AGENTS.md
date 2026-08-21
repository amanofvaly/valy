# AGENTS.md

## Overview

Medusa DTC Starter — a Turborepo workspace monorepo containing a Medusa backend (`@medusajs/medusa` latest, Node 20+, PostgreSQL 15+) and an optional storefront (Next.js, Tanstack, etc...).

## Directory Structure

```text
.
├── apps/
│   ├── backend/                  # Medusa application (@dtc/backend)
│   │   ├── medusa-config.ts      # Medusa config: DB URL, CORS, secrets, modules
│   │   ├── integration-tests/    # setup.js (Jest setupFiles) and http/*.spec.ts suites
│   │   └── src/
│   │       ├── admin/            # Admin dashboard extensions (widgets/, i18n/, routes)
│   │       ├── api/              # API routes: api/store/*, api/admin/* (file-based)
│   │       ├── jobs/             # Scheduled jobs
│   │       ├── links/            # Module links between modules
│   │       ├── modules/          # Custom modules (service + models + migrations)
│   │       ├── scripts/          # One-off scripts run via `medusa exec` (incl. seed.ts)
│   │       ├── subscribers/      # Event subscribers
│   │       └── workflows/        # Workflows and workflow steps
│   └── storefront/               # OPTIONAL storefront
├── eslint.config.ts              # Root ESLint: @medusajs/eslint-plugin recommended
├── turbo.json                    # Task graph: build, dev, start, lint, test, seed
```

**`apps/storefront` is optional and may not exist.** It is skipped when the user chooses not to install it. Before running any storefront command, referencing storefront files, or assuming a full-stack change is possible, check that `apps/storefront/` exists. If it doesn't, the project is backend-only — do not scaffold it or suggest it was deleted by mistake.

Each app can have its own nested `AGENTS.md`; agents read the nearest one in the directory tree, so put app-specific context there rather than expanding this file.

## Package Manager

**The package manager is chosen at install time and is not fixed.** Detect it before running anything, in this order:

1. The `packageManager` field in the root `package.json` (e.g. `"pnpm@10.11.1"`) — authoritative when present.
2. The lockfile at the repo root: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm.

```bash
node -p "require('./package.json').packageManager ?? 'unset'"
ls pnpm-lock.yaml yarn.lock package-lock.json bun.lock bun.lockb 2>/dev/null
```

Use that manager for every command and never introduce a second lockfile. Below, `<pm>` means the detected manager. The `<pm> run <script>` and `<pm> exec <bin>` forms work across npm, pnpm, yarn, and bun; workspace-filter flags do not, so the per-app commands below `cd` into the app instead.

## Commands

Run from the repo root unless noted. Turbo skips missing apps automatically.

### Development

```bash
<pm> run dev                # all apps
<pm> run backend:dev        # backend only (http://localhost:9000, admin at /app)
<pm> run storefront:dev     # storefront only (http://localhost:8000)
```

### Build

```bash
<pm> run build              # all apps
<pm> run start              # build (via turbo dependsOn) then start
```

### Lint

```bash
<pm> run lint                          # all apps via turbo
cd apps/backend && <pm> run lint       # medusa lint
cd apps/storefront && <pm> run lint    # next lint
```

### Test (backend only; the storefront has no test suite)

```bash
<pm> run test                                              # all test tasks via turbo
cd apps/backend && <pm> run test:unit                      # **/src/**/__tests__/**/*.unit.spec.ts
cd apps/backend && <pm> run test:integration:modules       # **/src/modules/*/__tests__/**
cd apps/backend && <pm> run test:integration:http          # **/integration-tests/http/*.spec.ts
```

Single test — pass a path/pattern through to Jest, keeping `TEST_TYPE`:

```bash
cd apps/backend && <pm> run test:unit -- src/modules/foo/__tests__/service.unit.spec.ts
cd apps/backend && <pm> run test:unit -- -t "returns the cart"
```

### Database

```bash
cd apps/backend
<pm> exec medusa db:generate <module-name>   # generate migrations for a custom module
<pm> exec medusa db:migrate                  # run migrations
<pm> exec medusa user -e admin@test.com -p supersecret
<pm> run backend:seed                        # from root; seeds demo data (opt-in, never automatic)
```

## Medusa Skills & MCP Server

These are optional but strongly recommended — they give documentation-backed answers instead of guesses about Medusa APIs. **Use them when available; if they are not, mention to the user that installing them meaningfully improves development on this project.**

**Agentic skills** ([docs](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills)) — if the `medusa-dev` skills are listed as available, load them *before* writing code, not after:

- `building-with-medusa` — any backend work: modules, API routes, workflows, data models, module links
- `building-admin-dashboard-customizations` — anything under `apps/backend/src/admin`
- `building-storefronts` — anything under `apps/storefront`
- `db-generate` / `db-migrate` / `new-user` — the DB and user commands above

If they are not installed, suggest:

```bash
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install medusa-dev@medusa
```

**MCP server** ([docs](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/mcp-server)) — a `medusa` MCP server exposing the official docs. Prefer it over web search or memory for any Medusa API, config, or upgrade question. If it is not connected, suggest:

```bash
claude mcp add --transport http medusa https://docs.medusajs.com/mcp # or agent equivalent
```

## Code Style

- **The backend must satisfy `@medusajs/eslint-plugin`'s recommended config** (`eslint.config.ts`). Its rules encode Medusa framework requirements — correct route/workflow/module shapes, not just cosmetics — so a lint failure usually means the code is actually wrong, not just badly formatted. Never disable a `@medusajs/*` rule to make lint pass; fix the code.
- No semicolons. Double quotes, 2-space indent.
- Files: kebab-case. Types/classes: PascalCase. Functions/variables: camelCase. DB columns: snake_case.
- No emojis in code, comments, or commit messages.

## Conventions

- **Backend routing is file-based.** A store endpoint is `src/api/store/<path>/route.ts` exporting `GET`/`POST`/etc. Don't add a router or register routes manually.
- **Business logic belongs in workflows**, not in route handlers. Routes resolve and run a workflow; workflows compose steps.
- Adding a task to `turbo.json` requires declaring its `outputs`, or Turbo will cache nothing/the wrong thing.

## Common Mistakes

- Running storefront commands without checking that `apps/storefront/` exists.
- Assuming a package manager instead of detecting it, or running a command that creates a second lockfile.
- Installing a dependency at the root instead of inside the app that needs it (`cd apps/backend && <pm> add <pkg>`).
- Editing a custom module's model without running `<pm> exec medusa db:generate <module>` — the migration is missing and the change silently never applies.
- Writing raw SQL or importing DB clients directly in the backend instead of going through module services / workflows.
- Calling the Medusa API from the storefront without `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`; requests fail with a publishable-key error, not an obvious 401.
- Running the test task without a reachable PostgreSQL — integration suites need a live DB.
- Silencing `@medusajs/*` ESLint rules instead of fixing the underlying pattern.

## Off-Limits

- `apps/backend/.medusa/`, `.next/`, `dist/`, `out/`, `.turbo/` — build output, excluded from the workspace and regenerated.
- The lockfile (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` — whichever this install produced) — never hand-edit or delete; change it only as a side effect of a package manager command.
- `.env` / `.env.local` — never commit, print, or copy secret values out of them. Edit `.env.template` instead when documenting a new variable.
- Existing migrations in `src/modules/*/migrations/` — add a new migration rather than rewriting one that may already have run.
- Don't run destructive DB commands (drops, `db:migrate --help`-style flags that reset state) against the user's database without explicit confirmation.

## Production (TrueNAS)

The stack runs on TrueNAS at `192.168.0.99`, deployed by Docker Compose **from the
host, not from Portainer**. Everything lives in `/mnt/Server-Storage/valy_backend/`:

| | |
| --- | --- |
| `docker-compose.yml` | the stack — postgres, redis, medusa, cloudflared, watchtower |
| `.env` | `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, secrets |
| `cloudflared/config.yml` | tunnel ingress for `api.valy.in` (root-owned) |

Compose is the only lever. To change any environment variable:

```bash
sudo -i
cd /mnt/Server-Storage/valy_backend
nano .env
docker compose up -d
```

`docker compose up -d` recreates only what changed and lets compose re-establish
networks and aliases.

**Never use Portainer's Recreate on a container in this stack.** Portainer sees it as
a "limited" stack — it did not create it, so it has no compose file and rebuilds the
container from its own view of it. That drops the compose-assigned network alias, and
on 2026-08-20 it took the site down: cloudflared could no longer resolve the origin
(`dial tcp: lookup medusa ... no such host`) while the container itself was healthy and
answering on the LAN. Portainer is for reading logs and inspecting state only.

Because of that outage the tunnel now targets `valy-medusa` — the explicit
`container_name` — instead of the compose service alias `medusa`. Address containers by
`container_name`; the service-name alias only exists while compose is doing the creating.

Deploys are automatic: pushing to `main` builds `ghcr.io/amanofvaly/valy-backend:latest`
via GitHub Actions, and watchtower (5-minute poll) restarts the container. The container
runs `medusa db:migrate --execute-safe-links` before starting, so schema changes apply
themselves. `--execute-safe-links` is required — without it a removed link makes
`db:migrate` stop at an interactive prompt and the container never serves.

`truenas_admin` can read these files over SSH but has no docker access and no
passwordless sudo; docker commands need a root shell.

## Agent Behavior & Accountability

- **Unauthorized Edits:** Never create or modify files without an explicit user approval, especially during Planning Mode. The user actively manages the workspace and will discard unapproved changes.
- **Do Not Make Assumptions:** If a file disappears, an edit fails, or the environment behaves unexpectedly, **ask the user** before launching into complex investigations or blaming background processes. Treat the user as a collaborative partner.
- **No Arrogance:** Do not act like a detached expert. If you don't know why something happened, admit it. Do not kill processes, change configurations, or run destructive commands based on unverified guesses.
