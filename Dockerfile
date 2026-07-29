# syntax=docker/dockerfile:1.7

FROM rust:1.88-bookworm AS backend-builder
WORKDIR /build/backend
COPY kahoot-clone-backend/Cargo.toml kahoot-clone-backend/Cargo.lock* ./
COPY kahoot-clone-backend/src ./src
RUN cargo build --release --locked

FROM backend-builder AS backend-test
RUN cargo test --release --locked

FROM node:24-bookworm-slim AS frontend-deps
WORKDIR /build/frontend
COPY kahoot-clone-frontend/package.json kahoot-clone-frontend/package-lock.json ./
RUN npm ci

FROM frontend-deps AS frontend-builder
COPY kahoot-clone-frontend ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run typecheck && npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    BACKEND_PORT=8000 \
    BACKEND_BINARY=/app/kahoot-server \
    MIGRATIONS_DIR=/app/db/migrations
WORKDIR /app

COPY --from=backend-builder --chown=node:node /build/backend/target/release/kahoot-server /app/kahoot-server
COPY --from=frontend-builder --chown=node:node /build/frontend/package.json /build/frontend/package-lock.json ./
COPY --from=frontend-builder --chown=node:node /build/frontend/node_modules ./node_modules
COPY --from=frontend-builder --chown=node:node /build/frontend/.next ./.next
COPY --from=frontend-builder --chown=node:node /build/frontend/public ./public
COPY --from=frontend-builder --chown=node:node /build/frontend/server.cjs ./server.cjs
COPY --from=frontend-builder --chown=node:node /build/frontend/scripts ./scripts
COPY --chown=node:node db ./db

USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.cjs"]
