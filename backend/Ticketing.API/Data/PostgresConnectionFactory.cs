using System.Security.Claims;
using Npgsql;

namespace Ticketing.API.Data;

public class PostgresConnectionFactory : IPostgresConnectionFactory
{
    private readonly string _csPostgres;
    private readonly string _csUsuario;
    private readonly string _csFuncionario;
    private readonly string _csAdmin;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PostgresConnectionFactory(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;

        // Cadena base: usada por endpoints públicos (login, registro, health)
        _csPostgres     = configuration.GetConnectionString("TicketingDb")
            ?? throw new InvalidOperationException("Cadena de conexion 'TicketingDb' no configurada.");

        // Cadenas por rol: si no están configuradas caen al usuario base
        _csUsuario      = configuration.GetConnectionString("TicketingDb_Usuario")     ?? _csPostgres;
        _csFuncionario  = configuration.GetConnectionString("TicketingDb_Funcionario") ?? _csPostgres;
        _csAdmin        = configuration.GetConnectionString("TicketingDb_Admin")       ?? _csPostgres;
    }

    // Lee el claim "rol" del JWT del request actual y selecciona la conexión adecuada.
    // Si no hay contexto HTTP (o el usuario no está autenticado) usa postgres.
    public NpgsqlConnection CreateConnection()
    {
        var rol = _httpContextAccessor.HttpContext?
            .User.FindFirstValue("rol");
        return CreateConnection(rol);
    }

    public NpgsqlConnection CreateConnection(string? rol) => rol switch
    {
        "admin"       => new NpgsqlConnection(_csAdmin),
        "funcionario" => new NpgsqlConnection(_csFuncionario),
        "usuario"     => new NpgsqlConnection(_csUsuario),
        _             => new NpgsqlConnection(_csPostgres),
    };
}
