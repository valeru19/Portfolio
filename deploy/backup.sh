#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$DIR/backups"
OUT="$DIR/backups/portfolio-$(date +%Y%m%d-%H%M%S).db"
# python:3.12-slim has no sqlite3 CLI — use stdlib .backup, then copy out.
docker compose -f "$DIR/docker-compose.yml" exec -T api \
  python -c "import sqlite3; s=sqlite3.connect('/app/data/portfolio.db'); d=sqlite3.connect('/tmp/b.db'); s.backup(d); d.close(); s.close()"
docker compose -f "$DIR/docker-compose.yml" cp api:/tmp/b.db "$OUT"
ls -1t "$DIR/backups"/portfolio-*.db 2>/dev/null | tail -n +15 | xargs -r rm --
echo "Wrote $OUT"
