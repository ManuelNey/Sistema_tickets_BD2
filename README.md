# Sistema de Ticketing — Mundial 2026

Sistema completo de venta y gestión de entradas para el Mundial FIFA 2026. Incluye portal web para usuarios y administradores, y app móvil para funcionarios. Permite registro, compra de entradas, transferencias entre usuarios y validación en puerta mediante códigos QR.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | .NET 8 (ASP.NET Core) |
| Base de datos | PostgreSQL 17 |
| Acceso a datos | ADO.NET + Npgsql (sin ORM) |
| Autenticación | JWT Bearer (claims personalizados) |
| Frontend | React 19 + Vite 8 (JSX) |
| Mobile | React Native 0.81 + Expo 54 |
| Infraestructura | Docker Compose |

---

## Levantar el proyecto

Requiere **Docker Desktop** instalado.

Desde la raíz del proyecto:

```bash
docker compose up --build
```

### Contenedores

| Contenedor | Puerto | Descripción |
|---|---|---|
| `ticketing-db` | 5432 | PostgreSQL 17 |
| `ticketing-api` | 8080 | API REST (.NET 8) + Swagger |
| `ticketing-front` | 5173 | Frontend React |

La BD se inicializa automáticamente la primera vez: Docker ejecuta los archivos de `database/init/` en orden alfabético al crear el volumen.

> Si el volumen ya existe, Docker **no** vuelve a ejecutar los scripts de init. Para partir de cero: `docker compose down -v && docker compose up --build`

## Inicialización de la base de datos

Los archivos en `database/init/` se ejecutan en orden numérico al crear el volumen:

| Archivo | Contenido |
|---|---|
| `01_schema.sql` | Tablas, constraints, índices, extensión btree_gist |
| `02_tablasMundial.sql` | 3 países sede, 16 estadios, 48 equipos, 72 encuentros |
| `03_usuarios.sql` | 10 usuarios, 5 funcionarios, 3 administradores de prueba |
| `04_operacion.sql` | 10 dispositivos, 64 sectores, habilitaciones, entradas |
| `05_negocio.sql` | Compras, transferencias y validaciones de ejemplo |
| `06_triggers.sql` | 2 triggers sobre transferencia (cambian estado de entrada) |
| `07_grants.sql` | 3 roles PostgreSQL: app_admin, app_funcionario, app_usuario |
| `08_trabaja_en.sql` | Asignaciones iniciales funcionario↔habilita |

> El orden importa: schema primero, datos del mundial, luego usuarios (que son FK de operacion y negocio).

## Aplicación móvil — React Native

El proyecto incluye una aplicación móvil desarrollada con **React Native + Expo**, ubicada en la carpeta:

```txt
/mobile
```

La aplicación está destinada a los funcionarios encargados de validar entradas en puerta mediante el escaneo de códigos QR.

> La aplicación móvil se ejecuta por separado de Docker Compose.

### Requisitos

Para ejecutar la aplicación móvil es necesario tener instalado:

- Node.js
- La aplicación **Expo Go** en el celular
- El backend levantado en el puerto `8080`
- El celular y la computadora conectados a la misma red Wi-Fi

### Iniciar la aplicación móvil

Desde una terminal ubicada en la carpeta raíz del proyecto, ejecutar:

```bash
cd mobile
npm install
npx expo start
```

Luego Expo mostrará un código QR en la terminal o en el navegador.

1. Abrir la aplicación **Expo Go** en el celular.
2. Escanear el código QR generado por Expo.
3. La aplicación se abrirá en el dispositivo móvil.

### Configuración de conexión con la API

La aplicación móvil no puede utilizar `localhost` para conectarse al backend, porque desde el celular `localhost` representa al propio dispositivo.

Por eso, se debe configurar la IP local de la computadora en los archivos **index.tsx** y **scanner.tsx**. Los cuales se encuentran en:
```txt
/mobile/app
```

```ts
const API_URL = 'http://TU_IP_LOCAL:8080'
```

Ejemplo:

```ts
const API_URL = 'http://192.168.1.10:8080'
```

En Windows, se puede consultar la IP local ejecutando:

```bash
ipconfig
```

Se debe utilizar la dirección `IPv4` correspondiente a la red Wi-Fi activa.

---

## Autenticación y roles

El sistema usa **JWT Bearer**. El token se obtiene en el login y debe enviarse en el header `Authorization: Bearer <token>` para los endpoints protegidos.

### Roles

| Rol | Descripción |
|---|---|
| `usuario` | Comprador de entradas. Puede ver estadios y sus propias entradas. |
| `admin` | Administrador de un país sede. Gestiona estadios y habilita encuentros. Tiene el claim `pais_sede` que restringe su scope a su país. |
| `funcionario` | Valida entradas en la puerta (scan de QR). |

### Claims del JWT

```
mail       → correo del usuario
nombre     → nombre
apellido   → apellido
rol        → "usuario" | "admin" | "funcionario"
pais_sede  → id del país sede (solo para admins, ej: 1=Canadá, 2=México, 3=USA)
```

### Cómo proteger un endpoint por rol

```csharp
[Authorize(Roles = "admin")]                    // solo admins
[Authorize(Roles = "admin,funcionario")]        // admins o funcionarios
[Authorize]                                     // cualquier usuario autenticado
```

Esto funciona porque `Program.cs` configura `RoleClaimType = "rol"` en los parámetros de validación del JWT, permitiendo el acceso al sistema según el rol.

### Usuarios de prueba (seed)

| Mail | Contraseña | Rol | País sede |
|---|---|---|---|
| `usuario1@mail.com` | `Password123` | usuario | — |
| `usuario2@mail.com` | `Password123` | usuario | — |
| `admin1@mail.com` | `Password123` | admin | Canadá (1) |
| `admin2@mail.com` | `Password123` | admin | México (2) |
| `admin3@mail.com` | `Password123` | admin | USA (3) |
| `funcionario1@mail.com` | `Password123` | funcionario | — |
| `funcionario2@mail.com` | `Password123` | funcionario | — |


---

---

## Flujos principales

### Flujo de compra

1. Usuario consulta partidos disponibles → `GET /api/menumatch/matches`
2. Selecciona sectores y cantidades → `POST /api/compra/reservar` (estado: `pendiente`)
3. La reserva expira en 15 minutos si no se paga
4. Usuario confirma el pago → `POST /api/compra/{id}/confirmar` (estado: `pagada`)
   - Las entradas asociadas pasan de `reservada` → `activa`
   - Usa `SELECT FOR UPDATE` para evitar race conditions de disponibilidad
5. También puede cancelar → `POST /api/compra/{id}/cancelar` (estado: `cancelada`)

### Flujo QR (validación en puerta)

1. Usuario genera QR → `POST /api/entradas/{id}/Qr`
   - El backend devuelve un JWT firmado con `tipo=qr_entrada`, expira en **30 segundos**
2. El frontend muestra ese JWT como código QR
3. Funcionario escanea con la app mobile → `POST /api/entradas/ScanQr?token=&deviceId=`
   - Valida: JWT vigente + `tipo=qr_entrada` + funcionario asignado al sector + entrada `activa`
   - Si todo es válido: entrada pasa a `utilizada`, se registra en `validacion`

### Flujo de transferencia

1. Usuario transfiere una entrada → `POST /api/transferencia`
   - La entrada pasa de `activa` → `transferida` (trigger `trg_transferencia_creada`)
2. Receptor acepta o rechaza → `PUT /api/transferencia/{id}/resolver`
   - Si acepta: entrada pasa a `activa` para el receptor (trigger `trg_transferencia_resuelta`)
   - Si rechaza: entrada vuelve a `activa` para el emisor
   - Límite: máximo 2 transferencias aceptadas por entrada

---

## Máquinas de estado

Un `BackgroundService` corre cada minuto y actualiza estados automáticamente.

### Servicios en segundo plano

El backend incluye servicios en segundo plano que se ejecutan automáticamente mientras la API está levantada. Estos servicios revisan periódicamente ciertos estados del sistema y los actualizan cuando corresponde.

#### ActualizarEstadosBackgroundService

Es el servicio que se ejecuta en segundo plano. Cada 1 minuto llama al servicio coordinador `ActualizarEstadosService`, que se encarga de ejecutar todas las actualizaciones automáticas del sistema.

#### ActualizarEstadosService

Funciona como servicio coordinador. Su responsabilidad es llamar a los servicios específicos que actualizan estados de distintas entidades:

- encuentros
- compras
- transferencias

#### ActualizarEstadosEncuentrosService

Actualiza automáticamente el estado de los encuentros según la fecha y hora:

- Los encuentros `programado` pasan a `en_juego` cuando llega su fecha.
- Los encuentros `en_juego` pasan a `finalizado` cuando ya pasó el tiempo definido para el partido.

#### ActualizarEstadosComprasService

Cancela automáticamente las compras que quedaron pendientes demasiado tiempo.

Si una compra está en estado `pendiente` por más de 15 minutos, el servicio la cambia a `cancelada`.

#### ActualizarEstadosTransferenciasService

Rechaza automáticamente las transferencias pendientes vencidas.

Si una transferencia está en estado `pendiente` por más de 24 horas, el servicio:

- cambia la transferencia a `rechazada`;
- cambia la entrada asociada de `transferida` a `activa`.

---

### Encuentro
```
programado → en_juego     (manual vía PUT /api/encuentros/{id} o automático al llegar la hora)
programado → cancelado
en_juego   → finalizado   (manual o automático: hora del partido + 2h)
cancelado  → programado
```
Un `BackgroundService` corre cada minuto y actualiza estados automáticamente.

### Compra
```
pendiente → pagada     (POST /api/compra/{id}/confirmar)
pendiente → cancelada  (POST /api/compra/{id}/cancelar)
```

### Entrada
```
reservada   → activa       (al confirmar la compra)
activa      → transferida  (trigger al insertar en transferencia)
transferida → activa       (trigger al resolver la transferencia o por evento automático de +24h para cancelarla)
activa      → utilizada    (ScanQr exitoso)
```

---

## Decisiones de base de datos

### Roles de PostgreSQL

La aplicación usa **3 roles de BD distintos**, uno por tipo de usuario. La conexión que se abre depende del claim `rol` del JWT:

| Rol JWT | Usuario PostgreSQL | Permisos |
|---|---|---|
| `admin` | `app_admin` | CRUD sobre recursos de su país sede |
| `funcionario` | `app_funcionario` | Solo lectura/escritura en validaciones |
| `usuario` | `app_usuario` | Solo sus propias entradas y compras |
| (público) | `postgres` | Endpoints sin auth (login, registro) |

Esto garantiza que a nivel de BD un usuario no pueda acceder a datos de otro rol, independientemente de la lógica de la API.

### Triggers

Definidos en `06_triggers.sql`, manejan las transiciones de estado de `entrada` al operar sobre `transferencia`:

- **`trg_transferencia_creada`** — al insertar una transferencia, cambia la entrada a `transferida`
- **`trg_transferencia_resuelta`** — al actualizar el estado de una transferencia, cambia la entrada a `activa` (tanto si se acepta como si se rechaza)


## Endpoints disponibles

Swagger disponible en `http://localhost:8080/swagger` con todos los endpoints documentados e interactivos.

### Usuario (`/api/usuario`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/usuario/registro` | No | Registra un nuevo usuario |
| `POST` | `/api/usuario/login` | No | Autentica y devuelve JWT |
| `GET` | `/api/usuario/perfil/{mail}` | `usuario` | Perfil del usuario autenticado |
| `PUT` | `/api/usuario/perfil/{mail}` | `usuario` | Actualiza perfil y/o contraseña |

### Estadios (`/api/estadios`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/estadios` | `admin`, `usuario` | Lista estadios (admin: solo su país) |
| `POST` | `/api/estadios/registro` | `admin` | Crea estadio en su país sede |
| `PUT` | `/api/estadios/{id}` | `admin` | Actualiza estadio |

### Sectores (`/api/sectores`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/sectores/{estadioId}` | `admin` | Lista sectores de un estadio |
| `POST` | `/api/sectores` | `admin` | Crea sector (máx. 4 por estadio) |
| `PUT` | `/api/sectores/{id}` | `admin` | Actualiza sector |
| `DELETE` | `/api/sectores/{id}` | `admin` | Elimina sector |

### Encuentros (`/api/encuentros`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/encuentros` | Público | Lista todos los encuentros |
| `POST` | `/api/encuentros` | `admin` | Crea encuentro en su país sede |
| `PUT` | `/api/encuentros/{id}` | `admin` | Actualiza estado o datos del encuentro |

### Compra (`/api/compra`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/compra/reservar` | `usuario` | Reserva entradas (estado: pendiente) |
| `POST` | `/api/compra/{id}/confirmar` | `usuario` | Confirma pago (estado: pagada) |
| `POST` | `/api/compra/{id}/cancelar` | `usuario` | Cancela reserva |
| `GET` | `/api/compra/mis-reservas/pendientes` | `usuario` | Lista reservas pendientes |
| `GET` | `/api/compra/mis-reservas/pagadas` | `usuario` | Lista compras pagadas |

### Entradas (`/api/entradas`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/entradas/mis-entradas` | `usuario` | Lista entradas activas del usuario |
| `GET` | `/api/entradas/codigosQr` | `usuario` | Lista entradas disponibles para QR |
| `POST` | `/api/entradas/{id}/Qr` | `usuario` | Genera JWT QR (expira en 30s) |
| `POST` | `/api/entradas/ScanQr` | `funcionario` | Valida QR y marca entrada como utilizada |

### Transferencias (`/api/transferencia`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/transferencia` | `usuario` | Transfiere entrada a otro usuario |
| `GET` | `/api/transferencia/enviadas` | `usuario` | Lista transferencias enviadas |
| `GET` | `/api/transferencia/recibidas` | `usuario` | Lista transferencias recibidas |
| `PUT` | `/api/transferencia/{id}/resolver` | `usuario` | Acepta o rechaza transferencia recibida |

### Funcionarios (`/api/funcionarios`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/funcionarios` | `admin` | Lista todos los funcionarios |
| `POST` | `/api/funcionarios` | `admin` | Crea un funcionario |
| `DELETE` | `/api/funcionarios/{mail}` | `admin` | Elimina un funcionario |

### Trabaja en (`/api/trabajaEn`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/trabajaEn` | `admin` | Asigna funcionario a una habilitación (encuentro+sector) |
| `DELETE` | `/api/trabajaEn` | `admin` | Desasigna funcionario |

### Dispositivos (`/api/dispositivo`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/dispositivo` | Público | Lista dispositivos registrados |
| `POST` | `/api/dispositivo` | `admin` | Registra dispositivo |
| `DELETE` | `/api/dispositivo/{id}` | `admin` | Elimina dispositivo |

### Comisiones (`/api/comision`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/comision/vigente` | `admin` | Comisión activa actual |
| `GET` | `/api/comision` | `admin` | Historial de comisiones |
| `POST` | `/api/comision` | `admin` | Crea nueva comisión |

### Estadísticas (`/api/estadisticas`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/estadisticas/entradas-por-encuentro` | `admin` | Entradas vendidas por partido |
| `GET` | `/api/estadisticas/entradas-por-estadio` | `admin` | Entradas vendidas por estadio |
| `GET` | `/api/estadisticas/top-compradores` | `admin` | Usuarios con más compras |
| `GET` | `/api/estadisticas/top-transferidores` | `admin` | Usuarios con más transferencias |
| `GET` | `/api/estadisticas/validaciones-por-dia` | `admin` | Validaciones agrupadas por día |

### Otros

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/paises` | `admin`, `usuario` | Lista los 3 países sede |
| `GET` | `/api/menumatch/matches` | `usuario` | Partidos con precio y cupos disponibles |
| `GET` | `/api/health` | Público | Estado de la API |

---

## Estructura del proyecto

```
Sistema_tickets_BD2/
├── backend/
│   └── Ticketing.API/
│       ├── Controllers/       → Rutas HTTP (orquestación, sin lógica de negocio)
│       ├── Repositories/      → Acceso a datos: SQL puro + mapeo a DTO
│       ├── Services/          → JwtService (generación de tokens)
│       ├── Data/              → IPostgresConnectionFactory / PostgresConnectionFactory
│       ├── DTOs/              → Objetos de entrada/salida de la API
│       ├── Models/            → Entidades del dominio
│       ├── Filters/           → Filtros de Swagger (ej: DateOnly)
│       └── Program.cs         → DI, JWT, CORS, pipeline
├── database/
│   └── init/
│       ├── 01_schema.sql
│       ├── 02_tablasMundial.sql
│       ├── 03_usuarios.sql
│       ├── 04_operacion.sql
│       ├── 05_negocio.sql
│       ├── 06_triggers.sql
│       ├── 07_grants.sql
│       └── 08_trabaja_en.sql
├── frontend/                  → React 19 + Vite 8
├── mobile/                    → React Native 0.81 + Expo 54
└── docker-compose.yml
```

---
