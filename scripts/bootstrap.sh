#!/usr/bin/env bash
set -euo pipefail

# Nota: si el volumen de Postgres ya existe, Docker NO vuelve a ejecutar los scripts de init.
# En ese caso usá ./scripts/reset-db.sh para partir de cero.

echo "Compilando la solución..."
dotnet build backend/backend.sln

echo "Iniciando Postgres..."
docker compose up -d postgres

echo "Esperando a que Postgres esté listo..."
for i in {1..60}; do
  if docker exec ticketing-db pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Construyendo e iniciando backend/frontend..."
docker compose build backend frontend
docker compose up -d backend frontend

echo "Bootstrap completado. Backend en http://localhost:8080"
