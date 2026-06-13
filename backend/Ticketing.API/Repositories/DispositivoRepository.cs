using Npgsql;
using Ticketing.API.Data;

namespace Ticketing.API.Repositories;

public class DispositivoRepository : IDispositivoRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public DispositivoRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<bool> CheckDeviceEnabled(string deviceId, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = @"
            SELECT COUNT(*)
            FROM dispositivo d
            JOIN trabaja_con t 
              ON d.numero_dispositivo = t.numero_dispositivo
            WHERE d.numero_dispositivo = @deviceId
              AND t.funcionario_mail = @mail
              AND d.estado = 'habilitado';
        ";

        await using var cmd = new NpgsqlCommand(sql, connection);
        cmd.Parameters.AddWithValue("@deviceId", deviceId);
        cmd.Parameters.AddWithValue("@mail", mail);

        var result = (long)await cmd.ExecuteScalarAsync();

        return result > 0;
    }
}