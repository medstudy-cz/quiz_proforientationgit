# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Self-hosted runners often have ~2GB; a 4GB heap makes the OOM killer fire sooner.
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_WORKER=false
ENV UV_THREADPOOL_SIZE=2
ENV DOCKER_BUILD=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Sanity Studio is not needed in the quiz runtime image and OOMs webpack on small runners
RUN rm -rf app/studio sanity.config.ts sanity.cli.ts sanity/schemas

RUN npm run build

# ---------- RUN ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
