#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  Build & optionally push the production container           ║
# ╚══════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./scripts/build-container.sh                  # build only
#   ./scripts/build-container.sh --push           # build + push
#   ./scripts/build-container.sh --load           # build + load into docker
#
# Reads config from .env.container (copy .env.container.example first).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.container"

# ── Load env ───────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌  $ENV_FILE not found."
  echo "    cp .env.container.example .env.container  # then fill values"
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

# ── Validate required vars ────────────────────────────────────
for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_APP_URL; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌  $var is required but empty. Set it in $ENV_FILE"
    exit 1
  fi
done

IMAGE="${IMAGE_NAME:-tukopamoja-web}:${IMAGE_TAG:-latest}"
echo "🐳  Building: $IMAGE"

# ── Parse flags ────────────────────────────────────────────────
PUSH=false
LOAD=false
for arg in "$@"; do
  case "$arg" in
    --push) PUSH=true ;;
    --load) LOAD=true ;;
  esac
done

# ── Build ──────────────────────────────────────────────────────
cd "$ROOT_DIR"

EXTRA_FLAGS=""
$PUSH && EXTRA_FLAGS="$EXTRA_FLAGS --push"
$LOAD && EXTRA_FLAGS="$EXTRA_FLAGS --load"

docker buildx build \
  -f Dockerfile.server \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  --build-arg NEXT_PUBLIC_MOBILE_SCHEME="${NEXT_PUBLIC_MOBILE_SCHEME:-tukopamoja}" \
  --target production \
  -t "$IMAGE" \
  $EXTRA_FLAGS \
  .

echo ""
echo "✅  Image built: $IMAGE"
echo ""
echo "Run locally:"
echo "  docker run -d -p ${PORT:-3000}:3000 --name tukopamoja $IMAGE"
echo ""
if $PUSH; then
  echo "🚀  Image pushed to registry."
fi
