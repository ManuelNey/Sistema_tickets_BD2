<#
Full reset: reset DB, reset backend, then start all services.

Usage: .\scripts\reset-all.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host "Reseteando BD..."
.\scripts\reset-db.ps1

Write-Host "Reseteando backend..."
.\scripts\reset-backend.ps1

Write-Host "Construyendo e iniciando frontend..."
docker compose build frontend
docker compose up -d frontend

Write-Host "Reset completo."
