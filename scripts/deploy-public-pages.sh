#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_REPO="${PUBLIC_PAGES_REPO:-}"
TARGET_BRANCH="gh-pages"
WORKTREE_DIR="/tmp/quizarena-public-pages"

if [[ -z "$TARGET_REPO" ]]; then
  echo "✗ PUBLIC_PAGES_REPO is not set. Expected owner/repo."
  exit 1
fi

cd "$REPO_ROOT"

echo "[1/7] Validating production environment..."
node scripts/validate-env.mjs --production

if [[ -f "$REPO_ROOT/packages/web/.env.production" ]]; then
  set -a
  source "$REPO_ROOT/packages/web/.env.production"
  set +a
fi

echo "[2/7] Building static web output..."
npm run build:web

echo "[3/7] Preparing temporary mirror checkout..."
rm -rf "$WORKTREE_DIR"

if [[ -n "${PUBLIC_PAGES_PAT:-}" ]]; then
  CLONE_URL="https://x-access-token:${PUBLIC_PAGES_PAT}@github.com/${TARGET_REPO}.git"
else
  CLONE_URL="git@github.com:${TARGET_REPO}.git"
fi

git clone "$CLONE_URL" "$WORKTREE_DIR"

echo "[4/7] Checking out ${TARGET_BRANCH}..."
cd "$WORKTREE_DIR"
if git show-ref --verify --quiet "refs/heads/${TARGET_BRANCH}"; then
  git checkout "$TARGET_BRANCH"
else
  git checkout --orphan "$TARGET_BRANCH"
  git rm -rf . >/dev/null 2>&1 || true
fi

echo "[5/7] Syncing static files..."
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
rsync -a --exclude='.git' "$REPO_ROOT/packages/web/out/" ./
touch .nojekyll

echo "[6/7] Committing changes..."
git config user.name "QuizArena Deploy Bot"
git config user.email "deploy-bot@users.noreply.github.com"
git add -A

if git diff --cached --quiet; then
  echo "No changes to deploy."
  rm -rf "$WORKTREE_DIR"
  exit 0
fi

git commit -m "Deploy static site from $(git -C "$REPO_ROOT" rev-parse --short HEAD)"

echo "[7/7] Pushing to ${TARGET_REPO}:${TARGET_BRANCH}..."
git push --force origin "$TARGET_BRANCH"

cd "$REPO_ROOT"
rm -rf "$WORKTREE_DIR"

echo "✅ Public Pages deploy complete."