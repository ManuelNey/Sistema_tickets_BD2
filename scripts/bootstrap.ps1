<#
Script de arranque para desarrollo (PowerShell).

Uso: desde la raíz del repo en PowerShell:
  .\scripts\bootstrap.ps1

Qué hace:
- Compila la solución .NET
- Inicia el contenedor Postgres (docker compose)
- Espera que la BD esté lista
- Docker aplica automáticamente los archivos database/init/01_schema.sql ... 05_negocio.sql
- Construye e inicia los contenedores de backend y frontend

Nota: si el volumen de Postgres ya existe, Docker NO vuelve a ejecutar los scripts de init.
En ese caso usá .\scripts\reset-db.ps1 para partir de cero.
#>

$ErrorActionPreference = 'Stop'

Write-Host "Compilando la solucion..."
dotnet build backend\backend.sln

Write-Host "Iniciando Postgres (docker compose)..."
docker compose up -d postgres

Write-Host "Esperando a que Postgres este listo..."

$ready = $false

for ($i = 0; $i -lt 60; $i++) {
    docker compose exec -T postgres pg_isready -U postgres *> $null

    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }

    Start-Sleep -Seconds 2
}

if (-not $ready) {
  Write-Error "Postgres no quedo listo a tiempo. Revisa 'docker compose logs postgres'."
  exit 1
}

Write-Host "Construyendo e iniciando contenedores backend/frontend..."
docker compose build backend frontend
docker compose up -d backend frontend

Write-Host "Bootstrap completado."
Write-Host "Backend disponible en http://localhost:8080"
Write-Host "Frontend disponible en http://localhost:5173"