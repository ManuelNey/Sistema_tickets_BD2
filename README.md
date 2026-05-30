# Sistema_tickets_BD2 — Guía detallada (carpeta por carpeta)

Este README explica la estructura del proyecto y presenta instrucciones para comprender su funcionamiento, por ahora solo está enfocado en el backend del mismo.
**Resumen**:El proyecto utiliza .NET 8 (API REST) con base de datos PostgreSQL y frontend Vite + React. 

**Estructura de carpetas (top-level)**
- **`backend/`**: solución .NET. La API está en **`backend/Ticketing.API`**.
  - Revisa `backend/Ticketing.API/Program.cs` ([Program.cs](backend/Ticketing.API/Program.cs#L1)) para ver el pipeline mínimo, DI y Swagger.
  - `backend/Ticketing.API/Controllers/` — controladores HTTP (ej.: `MenuMatchController`).
  - `backend/Ticketing.API/Repositories/` — acceso a datos (ej.: `MenuMatchDtoRepository.cs`).
  - `backend/Ticketing.API/Data/` — fábrica de conexiones (`IPostgresConnectionFactory` / `PostgresConnectionFactory`).
  - `backend/Ticketing.API/DTOs/` — DTOs compartidos (ej.: `MenuMatchDto`).
  - `backend/Ticketing.API/Models/` — entidades/ modelos del dominio (ej.: `Entrada`, `Encuentro`).
  - `backend/Ticketing.API/appsettings.json` — connection string por defecto para correr local.

- **`database/init/`**: scripts SQL de inicialización.
  - `schema.sql` — crea todas las tablas y constraints. Ver: [database/init/schema.sql](database/init/schema.sql#L1).
  - `seed.sql` — inserta datos mínimos para desarrollo (equipos, estadio, encuentro, habilita, entrada, etc.).

- **`frontend/`**: proyecto Vite/React (o similar) con Dockerfile para servir la UI.

- **`scripts/`**: Se generaro scripts de automatización (PowerShell y Bash) para iniciar y reset. Ver `scripts/README.md` que detalla cada uno. IMPORTANTE SI DESEAS LEVANTAR EL PROYECTO

**Detalles prácticos del backend**

**1) Inicio y configuración**
- Por defecto `backend/Ticketing.API/appsettings.json` contiene:
  - `ConnectionStrings:TicketingDb = "Host=localhost;Port=5432;Database=ticketing;Username=postgres;Password=postgres"`.
  - Esto es relevante si querés conectar desde una herramienta externa (DataGrip, DBeaver) o ejecutar la API localmente con `dotnet run`.

**2) Cómo se conecta la API a la BD**

- `backend/Ticketing.API/Data/PostgresConnectionFactory.cs` lee `ConnectionStrings:TicketingDb` desde `IConfiguration` y crea `NpgsqlConnection`. Centralizar la conexión facilita cambiar cadenas, añadir logging o mockear en tests.

**Modelos (`Models`) vs DTOs (`DTOs`)**

- **`Models`**: representan las entidades del dominio y/o la estructura de las tablas en la base de datos (ej.: `Ticket`, `Encuentro`). Se usan internamente en la capa de datos o en la lógica de negocio.
- **`DTOs`**: objetos de transferencia diseñados para la API. Se usan para devolver al cliente exactamente lo necesario (ej.: `MenuMatchDto`) o para recibir datos de entrada (`CreateTicketDto`).


Cuándo crear un DTO:
- Cuando la forma del dato devuelto difiere de la entidad DB (agregados,joins,transformaciones).
- Para controlar la superficie pública de la API (no exponer campos sensibles ni internos).

Ejemplo:

```csharp
// backend/Ticketing.API/Models/Ticket.cs
public class Ticket { public int Id { get; set; } public decimal Price { get; set; } /*...*/ }

// backend/Ticketing.API/DTOs/TicketDto.cs
public class TicketDto { public int Id { get; set; } public decimal Price { get; set; } }
```

**3) Repositorios y mapeo (Repository Pattern)**

- Un `Repository` encapsula la lógica de acceso a datos para una entidad o caso de uso concreto. Responsabilidades:
  - Ejecutar SQL o usar un ORM(Yo quería :(  ).
  - Mapear filas a `Model` o `DTO`.
  - Manejar transacciones cuando corresponda.
  - Exponer métodos con intención de negocio (`GetMenuMatchesAsync`, `CreateTicketAsync`).

- Qué no debe hacer:
  - No contener lógica de presentación ni exponer objetos de infraestructura.

Interfaz y ejemplo (esbozo):

```csharp
// backend/Ticketing.API/Repositories/IMenuMatchDtoRepository.cs
public interface IMenuMatchDtoRepository {
    Task<IReadOnlyCollection<MenuMatchDto>> GetMenuMatchesAsync(CancellationToken ct = default);
}

// backend/Ticketing.API/Repositories/MenuMatchDtoRepository.cs (esbozo)
public class MenuMatchDtoRepository : IMenuMatchDtoRepository {
    private readonly IPostgresConnectionFactory _connFactory;
    public MenuMatchDtoRepository(IPostgresConnectionFactory connFactory) => _connFactory = connFactory;

    public async Task<IReadOnlyCollection<MenuMatchDto>> GetMenuMatchesAsync(CancellationToken ct = default) {
        await using var conn = _connFactory.Create();
        await conn.OpenAsync(ct);
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "/* SQL complejo con joins */";
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        var list = new List<MenuMatchDto>();
        while (await reader.ReadAsync(ct)) {
            var dto = new MenuMatchDto {
                //Si ven que dan problema con mapear fecha y tiempo por separado guiense con esto
                Date = reader.IsDBNull(reader.GetOrdinal("fecha")) ? null : reader.GetFieldValue<DateOnly>(reader.GetOrdinal("fecha")), 
                Time = reader.IsDBNull(reader.GetOrdinal("hora")) ? null : reader.GetFieldValue<TimeOnly>(reader.GetOrdinal("hora")),
                // mapear otros campos
            };
            list.Add(dto);
        }
        return list;
    }
}
```

Buenas prácticas para repositorios:
- Usar `async`/`await` y aceptar `CancellationToken`.
- Centralizar `NpgsqlConnection` con `IPostgresConnectionFactory`.

**4) Controladores (Controllers)**

- Los controladores definen rutas HTTP, validan la entrada, llaman a repositorios o servicios y devuelven respuestas HTTP. Mantenerlos delgados (orquestación, validación básica, autorización).

Ejemplo (actual en el repo):

```csharp
// backend/Ticketing.API/Controllers/MenuMatchController.cs
[ApiController]
[Route("api/[controller]")]
public class MenuMatchController : ControllerBase {
    private readonly IMenuMatchDtoRepository _menuMatchRepo;
    public MenuMatchController(IMenuMatchDtoRepository menuMatchRepo) => _menuMatchRepo = menuMatchRepo;

    [HttpGet("matches")]
    public async Task<ActionResult<IReadOnlyCollection<MenuMatchDto>>> GetMenuMatches(CancellationToken ct) {
        var matches = await _menuMatchRepo.GetMenuMatchesAsync(ct);
        return Ok(matches);
    }
}
```

Puntos clave:
- Usar `ActionResult<T>` y `CancellationToken`.
- No poner lógica de negocio compleja en controllers.

**Dependency Injection (DI)**

- Registrar servicios en `Program.cs` permite inyectar dependencias en controllers y repos. Ejemplo de registro:

```csharp
builder.Services.AddScoped<IMenuMatchDtoRepository, MenuMatchDtoRepository>();
builder.Services.AddSingleton<IPostgresConnectionFactory, PostgresConnectionFactory>();
```
Cada nuevo Controller debe registrarse automáticamente mediante AddControllers().

Program.cs se utiliza principalmente para configurar servicios, dependencias, Swagger y el pipeline de ejecución. 

**Cómo añadir un nuevo endpoint (guía paso a paso)**

1. Diseñá la respuesta o request/respuesta → creá DTOs o Models si lo ves correcto en `backend/Ticketing.API/DTOs/`. 
2. Añadí un método en la interfaz del repository y su implementación que realice la query/operación.
3. Implementá el mapeo dentro del repository.
4. Añadí un controller con la ruta y acción, inyectando la interfaz del repo.
5. Registrá la implementación en `Program.cs`.
6. Probá en Swagger (`/swagger`) y con `curl` o Postman, lo que más te guste


