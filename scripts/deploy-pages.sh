#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKTREE_DIR="/tmp/quizarena-pages"
SOURCE_BRANCH="main"
TARGET_BRANCH="gh-pages"
TEMP_BRANCH="gh-pages-clean"

cd "$REPO_ROOT"

echo "╔══════════════════════════════════════════════════════╗"
echo "║          QuizArena — Deploy to GitHub Pages          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

echo "[1/10] Ensuring we are on ${SOURCE_BRANCH}..."
git checkout "$SOURCE_BRANCH" >/dev/null

echo "[2/10] Validating environment variables..."
node scripts/validate-env.mjs --production || {
  echo ""
  echo "✗ Deploy aborted — production environment variables are missing/invalid."
  echo "  Set production vars in shell OR create packages/web/.env.production"
  echo "  from packages/web/.env.production.example"
  exit 1
}

echo "[3/10] Building static web output..."
npm run build:web

echo "[4/10] Recreating temporary worktree..."
rm -rf "$WORKTREE_DIR"
git worktree prune

git fetch origin "$TARGET_BRANCH" >/dev/null 2>&1 || true

if git ls-remote --exit-code --heads origin "$TARGET_BRANCH" >/dev/null 2>&1; then
  git worktree add -f "$WORKTREE_DIR" "$TARGET_BRANCH"
else
  git worktree add -f -b "$TARGET_BRANCH" "$WORKTREE_DIR"
fi

echo "[5/10] Creating clean orphan history in worktree..."
cd "$WORKTREE_DIR"
git checkout --orphan "$TEMP_BRANCH"
git rm -rf . >/dev/null 2>&1 || true

echo "[6/10] Copying static files from packages/web/out..."
rsync -a --exclude='.git' "$REPO_ROOT/packages/web/out/" ./

touch .nojekyll

echo "[7/10] Committing static site..."
git add -A
git commit -m "Deploy static site" >/dev/null

echo "[8/10] Force-pushing clean ${TARGET_BRANCH} history..."
git push -f origin "$TEMP_BRANCH:$TARGET_BRANCH"

echo "[9/10] Cleaning up local temp state..."
cd "$REPO_ROOT"
git worktree remove -f "$WORKTREE_DIR"
git branch -D "$TEMP_BRANCH" >/dev/null 2>&1 || true

echo "[10/10] Post-deploy verification..."
echo ""
echo "┌─────────────────────────────────────────────────┐"
echo "│         POST-DEPLOY VERIFICATION CHECKLIST       │"
echo "├─────────────────────────────────────────────────┤"
echo "│  □  Open deployed URL and confirm page loads    │"
echo "│  □  Login with a test account                   │"
echo "│  □  Create or open a template                   │"
echo "│  □  Start Game → verify lobby displays          │"
echo "│  □  QR code URL points to deployed domain       │"
echo "│  □  Scan QR from phone → confirm join page      │"
echo "│  □  Open browser console → no env/fetch errors  │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "✅ Deployment complete. ${TARGET_BRANCH} updated successfully."
