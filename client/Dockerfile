# ── Build stage ──────────────────────────────────────────
# Swapped from alpine to bookworm-slim (Debian) for native ARM/esbuild support
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime stage ────────────────────────────────────────
# Serve the static production build instead of running the Vite dev
# server in production.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
