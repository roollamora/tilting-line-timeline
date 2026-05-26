#!/bin/bash
# Backup everything since last backup, then pull.
# Usage: ./safe-pull.sh   (or:  git pullsafe  if alias is set)

set -euo pipefail
cd "$(dirname "$0")"

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

mkdir -p "$BACKUP_PATH"

echo "Creating backup at ${BACKUP_PATH}/ ..."

# 1. Snapshot all tracked + untracked files (excluding .git and backups themselves)
rsync -a --exclude='.git' --exclude='backups' . "$BACKUP_PATH/"

# 2. Save current git state metadata
git log --oneline -20 > "$BACKUP_PATH/_git-log.txt"
git diff > "$BACKUP_PATH/_unstaged-changes.diff" 2>/dev/null || true
git diff --cached > "$BACKUP_PATH/_staged-changes.diff" 2>/dev/null || true
git status > "$BACKUP_PATH/_git-status.txt"
echo "$(git rev-parse HEAD)" > "$BACKUP_PATH/_commit-sha.txt"

# 3. Copy latest chat history from Cursor (if accessible)
TRANSCRIPT_SRC="$HOME/.cursor/projects/Users-roulla-Projects-Tilting-Line/agent-transcripts"
if [ -d "$TRANSCRIPT_SRC" ]; then
  mkdir -p "$BACKUP_PATH/chat-history"
  cp -R "$TRANSCRIPT_SRC/" "$BACKUP_PATH/chat-history/"
  echo "  Chat transcripts backed up."
fi

echo "  Backup complete: $(du -sh "$BACKUP_PATH" | cut -f1)"
echo ""

# 4. Pull
echo "Pulling from origin..."
git pull --rebase=false origin main

echo ""
echo "Done. Backup saved to: ${BACKUP_PATH}/"
