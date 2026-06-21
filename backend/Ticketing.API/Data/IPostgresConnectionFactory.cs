using Npgsql;

namespace Ticketing.API.Data;

public interface IPostgresConnectionFactory
{
    // Auto-detecta el rol del JWT del request actual y devuelve la conexión correspondiente.
    // Endpoints públicos (sin JWT) reciben la conexión base (postgres).
    NpgsqlConnection CreateConnection();

    // Sobrecarga explícita para pasar el rol manualmente cuando sea necesario.
    NpgsqlConnection CreateConnection(string? rol);
}