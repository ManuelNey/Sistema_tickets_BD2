#!/usr/bin/env bash
set -euo pipefail

echo "Deteniendo compose y eliminando volúmenes/imágenes..."
docker compose down -v --rmi local --remove-orphans

echo "Iniciando Postgres limpio..."
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

echo "Reset de la BD completado."
