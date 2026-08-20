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
CMD ["npm", "run", "start"]
