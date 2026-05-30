#!/usr/bin/env bash
set -euo pipefail

echo "Eliminando contenedor backend si existe..."
docker rm -f ticketing-api >/dev/null 2>&1 || true

echo "Construyendo la imagen del backend..."
docker compose build backend

echo "Iniciando el backend..."
docker compose up -d backend

echo "Reset del backend completado."
