#!/usr/bin/env bash
# scripts/dev-local.sh
# One-command local dev: starts the Docker Compose stack then Vite.
# Usage: npm run dev:local
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV_FILE="$ROOT/.env.docker"
EXAMPLE_FILE="$ROOT/.env.docker.example"

# ── Detect compose command ───────────────────────────────────────────────────
# Prefer `docker compose` (v2, bundled with Docker Desktop) if docker is in
# PATH; fall back to standalone `docker-compose` (v1).
if command -v docker &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  echo "❌ Neither 'docker' nor 'docker-compose' found in PATH."
  echo "   Please start Docker Desktop and try again."
  exit 1
fi

# ── Check Docker daemon is reachable ────────────────────────────────────────
if ! $COMPOSE version &>/dev/null 2>&1; then
  echo ""
  echo "❌ Docker daemon is not running."
  echo ""
  echo "   Docker Desktop is installed on your system."
  echo "   Please open it from your applications menu, wait for it to start,"
  echo "   then re-run:  npm run dev:local"
  echo ""
  exit 1
fi

# ── 1. Ensure .env.docker exists ────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "ℹ️  .env.docker not found — copying from .env.docker.example"
  cp "$EXAMPLE_FILE" "$ENV_FILE"
fi

# ── 2. Load vars from .env.docker ───────────────────────────────────────────
# shellcheck disable=SC2046
export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)

LOCAL_URL="http://localhost:8000"

# ── 3. Start Docker Compose stack ───────────────────────────────────────────
echo "🐳 Starting local Supabase stack..."
$COMPOSE --env-file "$ENV_FILE" -f "$ROOT/docker-compose.yml" up -d

# ── 4. Wait for health endpoint ─────────────────────────────────────────────
echo "⏳ Waiting for services to be ready (this may take ~30s on first run)..."
MAX_WAIT=90
ELAPSED=0
until curl -sf "$LOCAL_URL/auth/v1/health" >/dev/null 2>&1; do
  if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "❌ Stack did not become ready within ${MAX_WAIT}s."
    echo "   Check logs with: $COMPOSE logs"
    exit 1
  fi
  printf "."
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done
echo ""
echo "✅ Stack ready at $LOCAL_URL"
echo "   • REST API : $LOCAL_URL/rest/v1/"
echo "   • Auth API : $LOCAL_URL/auth/v1/"

# ── 5. Run Database Migrations ──────────────────────────────────────────────
echo "📦 Running database migrations..."
$COMPOSE exec -T db psql -U postgres -d postgres -f - < "$ROOT/supabase/migrations/001_shopping_list.sql"
echo "✅ Migrations completed successfully"

# ── 6. Launch Vite with local env vars ──────────────────────────────────────
# VITE_ vars set here take priority over .env.local — no file editing needed.
echo "🚀 Starting Vite dev server..."
VITE_SUPABASE_URL="$LOCAL_URL" \
VITE_SUPABASE_ANON_KEY="$ANON_KEY" \
  npx vite --config "$ROOT/vite.config.js"
