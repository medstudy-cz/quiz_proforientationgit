# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Avoid OOM on self-hosted runners during `next build`
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- RUN ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
