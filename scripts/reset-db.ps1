<#
Resetear la base de datos: baja todos los servicios, elimina el volumen y recrea Postgres.
Docker aplica automáticamente los archivos de database/init/ (01 a 05) en orden alfabético
al crear el volumen desde cero.

Uso: desde la raíz del repo en PowerShell:
  .\scripts\reset-db.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host "Deteniendo compose y eliminando volúmenes/imágenes..."
docker compose down -v --rmi local --remove-orphans

Write-Host "Iniciando Postgres desde cero..."
docker compose up -d postgres

Write-Host "Esperando a que Postgres esté listo (Docker aplica el schema y seed automáticamente)..."
for ($i = 0; $i -lt 60; $i++) {
    docker exec ticketing-db pg_isready -U postgres > $null 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Postgres no quedó listo a tiempo. Revisa 'docker logs ticketing-db'."
    exit 1
}

Write-Host "Reset de DB completado. Datos cargados desde database/init/01_schema.sql ... 05_negocio.sql"
