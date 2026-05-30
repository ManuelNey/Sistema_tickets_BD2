<#
Resetear la base de datos: detiene servicios, elimina volúmenes/imágenes, recrea Postgres y aplica schema+seed.

Uso: desde la raíz del repo en PowerShell:
  .\scripts\reset-db.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host "Deteniendo compose y eliminando volúmenes/imágenes..."
docker compose down -v --rmi local --remove-orphans

Write-Host "Iniciando Postgres desde cero..."
docker compose up -d postgres

Write-Host "Esperando a que Postgres esté listo..."
for ($i = 0; $i -lt 60; $i++) {
    docker exec ticketing-db pg_isready -U postgres > $null 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Postgres no quedó listo a tiempo. Revisa 'docker logs ticketing-db'."
    exit 1
}

Write-Host "Aplicando schema y seed..."
Get-Content -Raw .\database\init\schema.sql | docker exec -i ticketing-db psql -U postgres -d ticketing -q
Get-Content -Raw .\database\init\seed.sql | docker exec -i ticketing-db psql -U postgres -d ticketing -q

Write-Host "Reset de DB completado."
