#!/usr/bin/env bash
set -euo pipefail

# Resetear la base de datos: baja todos los servicios, elimina el volumen y recrea Postgres.
# Docker aplica automáticamente los archivos de database/init/ (01 a 05) en orden alfabético
# al crear el volumen desde cero.

echo "Deteniendo compose y eliminando volúmenes/imágenes..."
docker compose down -v --rmi local --remove-orphans

echo "Iniciando Postgres limpio..."
docker compose up -d postgres

echo "Esperando a que Postgres esté listo (Docker aplica el schema y seed automáticamente)..."
for i in {1..60}; do
  if docker exec ticketing-db pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Reset de la BD completado. Datos cargados desde database/init/01_schema.sql ... 05_negocio.sql"
