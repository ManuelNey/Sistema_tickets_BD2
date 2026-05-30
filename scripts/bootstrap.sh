#!/usr/bin/env bash
set -euo pipefail

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

echo "Aplicando schema y seed..."
docker exec -i ticketing-db psql -U postgres -d ticketing -q < database/init/schema.sql
docker exec -i ticketing-db psql -U postgres -d ticketing -q < database/init/seed.sql

echo "Construyendo e iniciando backend/frontend..."
docker compose build backend frontend
docker compose up -d backend frontend

echo "Bootstrap completado. Backend en http://localhost:8080"
