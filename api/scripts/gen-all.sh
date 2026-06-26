#!/usr/bin/env bash
set -euo pipefail

npx openapi-typescript api/openapi.yaml -o client/src/api.ts
