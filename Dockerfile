# ---------- BUILD ----------
FROM node:20-alpine AS builder

WORKDIR /app

RUN ls -la
RUN ls -la components || echo "NO components"
RUN ls -la components/quiz || echo "NO quiz"
 
COPY package.json package-lock.json ./ 

RUN npm install
RUN npm ci

COPY . .
RUN npm run build

# ---------- RUN ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./