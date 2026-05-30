Los scripts de esta carpeta se hicieron para automatizar el arranque y reset del proyecto (backend + BD + frontend).

PowerShell (Windows)
- `scripts\\bootstrap.ps1` – compila, inicia Postgres, aplica schema+seed, arranca backend/frontend
- `scripts\\reset-db.ps1` – baja compose, recrea Postgres y aplica schema+seed
- `scripts\\reset-backend.ps1` – reconstruye la imagen del backend y arranca el contenedor
- `scripts\\reset-all.ps1` – ejecuta reset-db y reset-backend y arranca frontend

Bash (Linux/macOS)
- `scripts/bootstrap.sh`
- `scripts/reset-db.sh`
- `scripts/reset-backend.sh`
- `scripts/reset-all.sh`

Ejemplos de uso (PowerShell):
  cd <raíz-del-repo>
  .\\scripts\\bootstrap.ps1

Ejemplos de uso (Unix):
  cd <raíz-del-repo>
  ./scripts/bootstrap.sh

Notas:
- Los scripts asumen que `docker` y `docker compose` están instalados y disponibles en `PATH`.
- `schema.sql` y `seed.sql` se aplican directamente en la base `ticketing` dentro del contenedor `ticketing-db`.
- Ejecutar `reset-db` elimina volúmenes e imágenes locales para dejar la BD limpia (es godd)
