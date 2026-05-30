using Npgsql;

namespace Ticketing.API.Data;

public class PostgresConnectionFactory : IPostgresConnectionFactory
{
    private readonly string _connectionString;

    public PostgresConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("TicketingDb")
            ?? throw new InvalidOperationException("No se encontro la cadena de conexion 'TicketingDb'.");
    }

    public NpgsqlConnection CreateConnection() => new(_connectionString);
}