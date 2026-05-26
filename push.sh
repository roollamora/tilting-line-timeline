#!/bin/bash
# Auto-stamp version and push. Usage: ./push.sh "commit message"
set -euo pipefail
cd "$(dirname "$0")"

MSG="${1:-Update}"

# Extract current version number from index.html
CURRENT_V=$(grep -o 'v[0-9][0-9]*' index.html | head -1 | tr -d 'v')
CURRENT_V=${CURRENT_V:-0}
NEXT_V=$((CURRENT_V + 1))
TIMESTAMP=$(date +"%Y-%m-%d %H:%M UTC%z")

# Update the version stamp in index.html
sed -i '' "s|v${CURRENT_V} —[^<]*|v${NEXT_V} — ${TIMESTAMP}|" index.html

# Also sync latest chat history into repo
TRANSCRIPT_SRC="$HOME/.cursor/projects/Users-roulla-Projects-Tilting-Line/agent-transcripts"
if [ -d "$TRANSCRIPT_SRC" ]; then
  mkdir -p chat-history
  rsync -a --delete "$TRANSCRIPT_SRC/" chat-history/
fi

git add -A
git commit -m "v${NEXT_V}: ${MSG}"
git push origin main

echo ""
echo "Pushed v${NEXT_V} at ${TIMESTAMP}"
echo "Live at: https://roollamora.github.io/tilting-line-timeline/"
