<#
Reset del backend: elimina contenedor e imagen local, reconstruye la imagen y arranca el contenedor.

Uso: .\scripts\reset-backend.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host "Deteniendo/eliminando contenedor backend si existe..."
docker rm -f ticketing-api 2>$null | Out-Null

Write-Host "Construyendo la imagen del backend..."
docker compose build backend

Write-Host "Iniciando el contenedor del backend..."
docker compose up -d backend

Write-Host "Reset del backend completado."
