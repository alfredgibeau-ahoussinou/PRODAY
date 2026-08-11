#!/usr/bin/env bash
# Déploie sur Netlify avec le handler SSR Next.js (OpenNext).
# Contourne un bug monorepo du edge-bundler (chemin website/.next/server manquant).
set -euo pipefail
cd "$(dirname "$0")/.."

# Pendant le build CLI, .env.local peut écraser les secrets Netlify si déjà absents
# du process.env. On isole le fichier local le temps du build pour coller à la prod.
LOCAL_ENV_BACKUP=""
restore_local_env() {
  if [[ -n "${LOCAL_ENV_BACKUP:-}" && -f "$LOCAL_ENV_BACKUP" ]]; then
    mv "$LOCAL_ENV_BACKUP" .env.local
    LOCAL_ENV_BACKUP=""
  fi
}
if [[ -f .env.local ]]; then
  LOCAL_ENV_BACKUP="$(mktemp -t proday-env-local.XXXXXX)"
  echo "→ isolate .env.local for production-aligned build"
  mv .env.local "$LOCAL_ENV_BACKUP"
  trap restore_local_env EXIT
fi

materialize_edge_middleware() {
  local EDGE_DIR=".netlify/edge-functions/___netlify-edge-handler-node-middleware"
  local TARGET="$EDGE_DIR/server/website/.next/server"
  if [[ -d .next/server && -d "$EDGE_DIR" ]]; then
    echo "→ materialize middleware path for edge bundler"
    mkdir -p "$TARGET"
    rsync -a --delete \
      --include='middleware.js' \
      --include='middleware.js.map' \
      --include='middleware.js.nft.json' \
      --include='middleware/***' \
      --include='chunks/***' \
      --exclude='*' \
      .next/server/ "$TARGET/"
  fi
}

echo "→ netlify build"
set +e
netlify build
build_status=$?
set -e

materialize_edge_middleware

restore_local_env
trap - EXIT

if [[ $build_status -ne 0 ]]; then
  echo "→ netlify build failed (often edge bundling); deploying static + functions anyway"
fi

if [[ ! -d .netlify/static || ! -d .netlify/functions-internal ]]; then
  echo "Missing .netlify/static or .netlify/functions-internal — abort."
  exit 1
fi

DEPLOY_ARGS=(--prod --dir .netlify/static --functions .netlify/functions-internal --message "${NETLIFY_DEPLOY_MESSAGE:-ProDay website}")
if netlify deploy --help 2>&1 | grep -q -- '--no-build'; then
  DEPLOY_ARGS+=(--no-build)
fi

echo "→ netlify deploy (production)"
netlify deploy "${DEPLOY_ARGS[@]}"
