#!/usr/bin/env bash
set -euo pipefail

URL="${PUBLIC_LIVE_URL:-https://tarto-4.github.io/quizarena-gh-pages/}"
EXPECTED_TEXT="${PUBLIC_LIVE_EXPECTED_TEXT:-TUKOPAMOJA}"
FORBIDDEN_TEXT="${PUBLIC_LIVE_FORBIDDEN_TEXT:-QuizArena}"
MAX_RETRIES="${PUBLIC_LIVE_MAX_RETRIES:-6}"
SLEEP_SECONDS="${PUBLIC_LIVE_RETRY_SLEEP_SECONDS:-10}"
TMP_FILE="/tmp/quizarena-public-live-check.html"

if ! [[ "$MAX_RETRIES" =~ ^[0-9]+$ ]] || ! [[ "$SLEEP_SECONDS" =~ ^[0-9]+$ ]]; then
  echo "✗ PUBLIC_LIVE_MAX_RETRIES and PUBLIC_LIVE_RETRY_SLEEP_SECONDS must be integers"
  exit 1
fi

for ((i=1; i<=MAX_RETRIES; i++)); do
  HTTP_CODE="$(curl -L -s -o "$TMP_FILE" -w "%{http_code}" "$URL")"
  echo "Attempt ${i}/${MAX_RETRIES} -> HTTP ${HTTP_CODE}"

  if [[ "$HTTP_CODE" == "200" ]] && grep -q "$EXPECTED_TEXT" "$TMP_FILE"; then
    if grep -q "$FORBIDDEN_TEXT" "$TMP_FILE"; then
      echo "✗ Live page still contains forbidden text: ${FORBIDDEN_TEXT}"
      exit 1
    fi

    echo "✅ Live check passed: found '${EXPECTED_TEXT}' and did not find '${FORBIDDEN_TEXT}'"
    exit 0
  fi

  if (( i < MAX_RETRIES )); then
    sleep "$SLEEP_SECONDS"
  fi
done

echo "✗ Live check failed after ${MAX_RETRIES} attempts"
echo "  URL: ${URL}"
echo "  Expected text: ${EXPECTED_TEXT}"
echo "  Forbidden text: ${FORBIDDEN_TEXT}"
exit 1
