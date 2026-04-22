#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE_DIR="/tmp/quizarena-pages"
SOURCE_BRANCH="main"
TARGET_BRANCH="gh-pages"
TEMP_BRANCH="gh-pages-clean"

cd "$REPO_ROOT"

echo "[1/8] Ensuring we are on ${SOURCE_BRANCH}..."
git checkout "$SOURCE_BRANCH" >/dev/null

echo "[2/8] Building static web output..."
npm run build:web

echo "[3/8] Recreating temporary worktree..."
rm -rf "$WORKTREE_DIR"
git worktree prune

git fetch origin "$TARGET_BRANCH" >/dev/null 2>&1 || true

if git ls-remote --exit-code --heads origin "$TARGET_BRANCH" >/dev/null 2>&1; then
  git worktree add -f "$WORKTREE_DIR" "$TARGET_BRANCH"
else
  git worktree add -f -b "$TARGET_BRANCH" "$WORKTREE_DIR"
fi

echo "[4/8] Creating clean orphan history in worktree..."
cd "$WORKTREE_DIR"
git checkout --orphan "$TEMP_BRANCH"
git rm -rf . >/dev/null 2>&1 || true

echo "[5/8] Copying static files from packages/web/out..."
rsync -a --exclude='.git' "$REPO_ROOT/packages/web/out/" ./

touch .nojekyll

echo "[6/8] Committing static site..."
git add -A
git commit -m "Deploy static site" >/dev/null

echo "[7/8] Force-pushing clean ${TARGET_BRANCH} history..."
git push -f origin "$TEMP_BRANCH:$TARGET_BRANCH"

echo "[8/8] Cleaning up local temp state..."
cd "$REPO_ROOT"
git worktree remove -f "$WORKTREE_DIR"
git branch -D "$TEMP_BRANCH" >/dev/null 2>&1 || true

echo "✅ Deployment complete. ${TARGET_BRANCH} updated successfully."
