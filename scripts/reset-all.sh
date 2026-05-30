#!/usr/bin/env bash
set -euo pipefail

./scripts/reset-db.sh
./scripts/reset-backend.sh

echo "Construyendo e iniciando frontend..."
docker compose build frontend
docker compose up -d frontend

echo "Reset completo."
