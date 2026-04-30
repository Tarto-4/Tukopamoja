# ╔══════════════════════════════════════════════════════════════╗
# ║  TUKOPAMOJA — Multi-stage Production Dockerfile             ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Builds the Next.js static export and serves it via nginx.
# Supports build-time environment injection for any deployment target.
#
# Build:
#   docker build \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
#     --build-arg NEXT_PUBLIC_APP_URL=https://yourdomain.com \
#     -t quizarena-web .
#
# Run:
#   docker run -p 3000:80 quizarena-web

# ─── Stage 1: Install dependencies ──────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy workspace root + package files for all workspaces
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/web/package.json packages/web/
COPY packages/mobile/package.json packages/mobile/

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# ─── Stage 2: Build the static site ─────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments — injected at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MOBILE_SCHEME=quizarena

# Make build args available as env vars during build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_MOBILE_SCHEME=${NEXT_PUBLIC_MOBILE_SCHEME}

# Copy deps from stage 1 (npm workspaces hoists to root node_modules)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/web/ packages/web/
COPY package.json ./

# Build the static export
RUN npm run build:web

# ─── Stage 3: Serve with nginx ──────────────────────────────
FROM nginx:1.27-alpine AS production

# Add non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy custom nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy static files from builder
COPY --from=builder /app/packages/web/out /usr/share/nginx/html

# Ensure correct permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown appuser:appgroup /var/run/nginx.pid

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Run as non-root
USER appuser

CMD ["nginx", "-g", "daemon off;"]
