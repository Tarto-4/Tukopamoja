#!/usr/bin/env bash
set -euo pipefail

TARGET="packages/web/.env.local"
SOURCE="packages/web/.env.local.example"

if [[ ! -f "$SOURCE" ]]; then
  echo "❌ Missing template file: $SOURCE"
  exit 1
fi

if [[ -f "$TARGET" ]]; then
  echo "ℹ️  $TARGET already exists. No changes made."
  exit 0
fi

cp "$SOURCE" "$TARGET"
echo "✅ Created $TARGET from $SOURCE"
echo "👉 Next: edit $TARGET with real values, then run npm run dev:web"
