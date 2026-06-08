#!/usr/bin/env bash
# Déploie sur Netlify avec le handler SSR Next.js (OpenNext).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ netlify build"
netlify build

echo "→ netlify deploy (production)"
netlify deploy --prod --no-build \
  --dir .netlify/static \
  --functions .netlify/functions-internal
