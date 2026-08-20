FROM node:20-alpine AS base

# Install python and build dependencies (required for some node native modules)
RUN apk add --no-cache python3 make g++ 
# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

FROM base AS builder
WORKDIR /app
# Copy root package/lock and turbo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# Copy apps
COPY apps/backend ./apps/backend
# Install dependencies
RUN pnpm install --frozen-lockfile
# Build the backend
RUN pnpm run build --filter=@dtc/backend...

FROM base AS runner
WORKDIR /app
# Copy built output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend

WORKDIR /app/apps/backend/.medusa/server
EXPOSE 9000
# Schema first, then serve. Migrations belong to the deploy, not to an
# admin remembering to run them after every publish. Medusa records what
# has already run, so this is a no-op when nothing is pending.
#
# Safe here because exactly one container serves this app. With more than
# one replica this has to move into its own step that runs before them,
# or they race each other applying the same migration.
# --execute-safe-links is not optional here. When a link is removed from the
# code, db:migrate stops and asks which tables to drop. Inside a container
# nobody can answer, so the deploy hangs at the prompt and never serves.
# "safe" also means a deploy never drops a table on its own: destructive
# changes belong in a migration you can read and roll back.
CMD ["sh", "-c", "npx medusa db:migrate --execute-safe-links && npm run start"]
