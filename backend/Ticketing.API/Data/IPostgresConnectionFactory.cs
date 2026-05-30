using Npgsql;

namespace Ticketing.API.Data;

public interface IPostgresConnectionFactory
{
    NpgsqlConnection CreateConnection();
}