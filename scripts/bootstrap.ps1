<#
Script de arranque para desarrollo (PowerShell).

Uso: desde la raíz del repo en PowerShell:
  .\scripts\bootstrap.ps1

Qué hace:
- Compila la solución .NET
- Inicia el contenedor Postgres (docker compose)
- Espera que la BD esté lista
- Aplica `schema.sql` y `seed.sql`
- Construye e inicia los contenedores de backend y frontend
#>

set -e
$ErrorActionPreference = 'Stop'

Write-Host "Compilando la solución..."
dotnet build backend\backend.sln

Write-Host "Iniciando Postgres (docker compose)..."
docker compose up -d postgres

Write-Host "Esperando a que Postgres esté listo..."
for ($i = 0; $i -lt 60; $i++) {
    $res = docker exec ticketing-db pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}

if ($LASTEXITCODE -ne 0) {
  Write-Error "Postgres no quedó listo a tiempo. Revisa 'docker logs ticketing-db'."
  exit 1
}

Write-Host "Aplicando schema.sql y seed.sql..."
Get-Content -Raw .\database\init\schema.sql | docker exec -i ticketing-db psql -U postgres -d ticketing -q
Get-Content -Raw .\database\init\seed.sql | docker exec -i ticketing-db psql -U postgres -d ticketing -q

Write-Host "Construyendo e iniciando contenedores backend/frontend..."
docker compose build backend frontend
docker compose up -d backend frontend

Write-Host "Bootstrap completado. Backend disponible en http://localhost:8080"
