#!/usr/bin/env bash
# Regenerate bindings/typescript/*.ts from schemas/*.schema.json.
#
# Ruled binding in Session 4: schemas are implementation-agnostic;
# bindings are generated (versioned for discoverability but reproducible
# from schemas alone).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMAS="$REPO_ROOT/schemas"
OUT="$REPO_ROOT/bindings/typescript"

mkdir -p "$OUT"

if ! command -v json2ts >/dev/null 2>&1; then
  echo "Installing json-schema-to-typescript locally..." >&2
  npm install -g json-schema-to-typescript
fi

for schema in "$SCHEMAS"/*.schema.json; do
  name="$(basename "$schema" .schema.json)"
  echo "Generating $name.ts from $(basename "$schema")..."
  json2ts "$schema" > "$OUT/$name.ts"
done

echo "Bindings regenerated at $OUT"
