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
       // Usamos httpContextAccessor para acceder al contexto HTTP actual y leer los claims del usuario.
       // Leemos las cadenas de conexión desde la configuración. Si no están configuradas, usamos la cadena de postgres por defecto.
       
        _csPostgres     = configuration.GetConnectionString("TicketingDb")
            ?? throw new InvalidOperationException("Cadena de conexion 'TicketingDb' no configurada.");
        _csUsuario      = configuration.GetConnectionString("TicketingDb_Usuario")     ?? _csPostgres;
        _csFuncionario  = configuration.GetConnectionString("TicketingDb_Funcionario") ?? _csPostgres;
        _csAdmin        = configuration.GetConnectionString("TicketingDb_Admin")       ?? _csPostgres;
    }

    // Lee el claim "rol" del JWT del request actual y selecciona la conexión adecuada.
    // Si no hay contexto HTTP (o el usuario no está autenticado) usa postgres.
    public NpgsqlConnection CreateConnection()
    {
        // Crea la conexion en base a el rol del usuario obtenido del claim "rol" en el JWT.
        var rol = _httpContextAccessor.HttpContext?
            .User.FindFirstValue("rol");
        return CreateConnection(rol);
    }

    // Crea la conexión a la bd en base a el rol del usuario.
    public NpgsqlConnection CreateConnection(string? rol)
    {
        switch (rol)
        {
            case "admin":
                return new NpgsqlConnection(_csAdmin);

            case "funcionario":
                return new NpgsqlConnection(_csFuncionario);

            case "usuario":
                return new NpgsqlConnection(_csUsuario);

            default:
                return new NpgsqlConnection(_csPostgres);
        }
    }
}
