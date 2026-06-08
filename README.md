# Sistema de Ticketing — Mundial 2026

API REST para la gestión de entradas al Mundial 2026. Permite registro de usuarios, compra y transferencia de entradas, y validación en puerta mediante QR.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | .NET 8 (ASP.NET Core) |
| Base de datos | PostgreSQL 17 |
| Acceso a datos | ADO.NET + Npgsql (sin ORM) |
| Autenticación | JWT Bearer (claims personalizados) |
| Frontend | React + Vite |
| Infraestructura | Docker Compose |

---

## Levantar el proyecto

Requiere **Docker** y **Docker Compose** instalados.

**Windows (PowerShell):**
```powershell
.\scripts\bootstrap.ps1
```

**Linux / macOS:**
```bash
./scripts/bootstrap.sh
```

Esto levanta tres contenedores:

| Contenedor | Puerto | Descripción |
|---|---|---|
| `ticketing-db` | 5432 | PostgreSQL 17 |
| `ticketing-api` | 8080 | API REST (.NET 8) |
| `ticketing-front` | 5173 | Frontend React (pendiente) |

La BD se inicializa automáticamente la primera vez: Docker ejecuta los archivos de `database/init/` en orden alfabético al crear el volumen.

### Resetear la base de datos

```powershell
# Windows
.\scripts\reset-db.ps1

# Linux/macOS
./scripts/reset-db.sh
```

Esto baja los contenedores, **elimina el volumen** (borrando todos los datos) y los vuelve a levantar. Docker re-ejecuta los scripts de init automáticamente con datos limpios.

---

## Inicialización de la base de datos

Los archivos en `database/init/` se ejecutan en orden numérico al crear el volumen:

| Archivo | Contenido |
|---|---|
| `01_schema.sql` | Creación de todas las tablas, constraints e índices |
| `02_tablasMundial.sql` | 3 países sede, 16 estadios, 48 equipos, 72 encuentros |
| `03_usuarios.sql` | 10 usuarios, 5 funcionarios, 3 administradores de prueba |
| `04_operacion.sql` | Dispositivos, sectores (64 en total), habilitaciones, entradas |
| `05_negocio.sql` | Compras, transferencias y datos de operación |

> El orden importa: schema primero, datos del mundial, luego usuarios (que son FK de operacion y negocio).

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

---

## Endpoints disponibles

### Usuario (`/api/usuario`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/usuario/registro` | No | Registra un nuevo usuario. Devuelve el JWT. |
| `POST` | `/api/usuario/login` | No | Autentica y devuelve el JWT con claims de rol. |
| `GET` | `/api/usuario/perfil/{mail}` | No | Perfil de un usuario por mail. |

#### Body de registro
```json
{
  "mail": "nuevo@mail.com",
  "nombre": "Juan",
  "apellido": "García",
  "contrasena": "mipassword",
  "fechaNacimiento": "1995-03-15",
  "tipoDocumento": "CI",
  "paisDocumento": "Uruguay",
  "numeroDocumento": "12345678",
  "paisCasa": "Uruguay",
  "localidad": "Montevideo",
  "calle": "Av. 18 de Julio",
  "numeroCasa": "1234",
  "codigoPostal": "11100"
}
```

#### Body de login
```json
{
  "mail": "admin1@mail.com",
  "contrasena": "adminpass1"
}
```

---

### Estadios (`/api/estadios`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/estadios` | `admin`, `usuario` | Lista todos los estadios. |
| `POST` | `/api/estadios/registro` | `admin` | Crea un nuevo estadio. |
| `PUT` | `/api/estadios/{id}` | `admin` | Actualiza un estadio existente. |

#### Body de crear estadio
```json
{
  "nombre": "Estadio Ejemplo",
  "ciudad": "Montevideo",
  "fkPaisSede": 1
}
```

---

### Partidos (`/api/menumatch`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/menumatch/matches` | No | Lista encuentros con equipos, estadio y fecha. |

---

### Health check (`/api/health`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/health` | No | Verifica que la API está corriendo. |

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
│       └── 05_negocio.sql
├── frontend/                  → React + Vite 
├── scripts/                   → bootstrap, reset-db, reset-backend, reset-all (.ps1 y .sh)
└── docker-compose.yml
```

---

## Cómo añadir un nuevo endpoint

1. **DTO**: Crear en `DTOs/` el objeto de entrada y/o respuesta que necesite el endpoint.
2. **Interfaz del repositorio**: Declarar el método en `IXxxRepository`.
3. **Implementación**: En `XxxRepository.cs`, escribir la query SQL y mapear el resultado al DTO.
   - Si hay que leer un `DateOnly` o `TimeOnly` desde el reader, usar `reader.GetFieldValue<DateOnly>(ordinal)`.
   - Si hay múltiples INSERTs relacionados, envolverlos en `NpgsqlTransaction`.
4. **Controller**: Crear el controller con `[ApiController]`, `[Route("api/[controller]")]` y los atributos de autorización que correspondan.
5. **Registrar en `Program.cs`**: `builder.Services.AddSingleton<IXxxRepository, XxxRepository>();`
6. **Probar**: Swagger está disponible en `http://localhost:8080/swagger`.

### Patrón de repositorio (ejemplo)

```csharp
// Repositories/IEjemploRepository.cs
public interface IEjemploRepository {
    Task<EjemploDto?> GetByIdAsync(int id);
}

// Repositories/EjemploRepository.cs
public class EjemploRepository : IEjemploRepository {
    private readonly IPostgresConnectionFactory _connectionFactory;

    public EjemploRepository(IPostgresConnectionFactory connectionFactory) {
        _connectionFactory = connectionFactory;
    }

    public async Task<EjemploDto?> GetByIdAsync(int id) {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var cmd = connection.CreateCommand();

        cmd.CommandText = "SELECT id, nombre FROM ejemplo WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        return new EjemploDto {
            Id = reader.GetInt32(reader.GetOrdinal("id")),
            Nombre = reader.GetString(reader.GetOrdinal("nombre"))
        };
    }
}
```

---
