# Sistema_tickets_BD2

Sistema de tickets en desarrollo con backend en .NET 8, frontend en React + Vite y base de datos PostgreSQL.

## Estado actual

El proyecto por ahora tiene:

- una API en ASP.NET Core ubicada en `backend/Ticketing.API` 
- una aplicación web en React ubicada en `frontend`
- una base de datos PostgreSQL definida para ejecutarse con Docker

Por ahora la API expone endpoints básicos de prueba:

- `GET /` devuelve `API funcionando`
- `GET /weatherforecast` devuelve datos de ejemplo generados por una plantilla de .NET
- Swagger está habilitado para que podamos ver la API

El frontend todavía conserva la pantalla inicial generada por Vite y React.

## Estructura

- `backend/`: solución .NET con la API principal
- `frontend/`: cliente web con Vite y React
- `database/`: documentos y scripts relacionados con la base de datos y el MER
- `docker-compose.yml`: orquestacion de la base de datos, backend y frontend

## Arquitectura Del Backend

El backend esta dividido en capas para mantener el codigo ordenado y facilitar el crecimiento del sistema.

- `Ticketing.API/`: es la puerta de entrada del sistema. Aca viven los endpoints HTTP, Swagger y la configuracion general.
- `Ticketing.Application/`: contiene la logica principal de la aplicacion y los casos de uso, como compras, transferencias y validaciones.
- `Ticketing.Domain/`: representa las entidades y reglas del negocio, como usuarios, eventos, entradas y ventas.
- `Ticketing.Infrastructure/`: se encarga de la conexion con PostgreSQL, Entity Framework y la persistencia de datos.

Flujo general:

`Frontend` -> `API` -> `Application` -> `Domain` -> `Infrastructure` -> `PostgreSQL`

La idea de esta separacion es que cada parte tenga una responsabilidad clara y sea mas facil agregar funcionalidades mas adelante.

## Requisitos

- Docker y Docker Compose.

## Ejecutar con Docker

Desde la raíz del proyecto:

```bash
docker-compose up --build
```

Servicios disponibles:

- API: `http://localhost:8080`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`

## Ejecutar localmente

### Backend

```bash
cd backend
dotnet run --project Ticketing.API/Ticketing.API.csproj
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notas

- El backend usa Swagger en desarrollo.
- La aplicación sigue en una etapa inicial, así que este README se actualizará cuando se agreguen las entidades, los endpoints y flujo del proyecto.
