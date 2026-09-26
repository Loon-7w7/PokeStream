# Imagen de producción. Uso: docker compose up -d --build
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1) Dependencias (incluye generar el cliente de Prisma en postinstall)
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# 2) Build de Next.js en modo standalone
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# 3) Imagen final mínima
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/app.db
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# CLI de Prisma (misma versión que package-lock) solo para aplicar migraciones al arrancar
COPY package-lock.json /tmp/package-lock.json
RUN npm install -g "prisma@$(node -p "require('/tmp/package-lock.json').packages['node_modules/prisma'].version")" \
    && rm /tmp/package-lock.json && npm cache clean --force

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000
# Aplica migraciones pendientes y arranca el servidor
CMD ["sh", "-c", "prisma migrate deploy && exec node server.js"]
