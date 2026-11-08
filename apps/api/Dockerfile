# Build from the repo root (copied from uma-rpg's):
#   docker build --secret id=npm_token,env=NODE_AUTH_TOKEN -f apps/api/Dockerfile -t farm-api .
# The secret is a token with read:packages, for @luismlorenzana/* on GitHub Packages; it never lands in a layer.

FROM node:22-slim AS builder
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json

RUN --mount=type=secret,id=npm_token NODE_AUTH_TOKEN="$(cat /run/secrets/npm_token)" \
    pnpm install --filter @farm/api... --frozen-lockfile

COPY packages/domain packages/domain
COPY apps/api apps/api
RUN pnpm --filter @farm/domain build && pnpm --filter @farm/api build
RUN --mount=type=secret,id=npm_token NODE_AUTH_TOKEN="$(cat /run/secrets/npm_token)" \
    pnpm --filter @farm/api --prod deploy --legacy /out

FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app
COPY --from=builder /out ./
EXPOSE 8080
CMD ["node", "dist/main.js"]
