using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class ComisionRepository : IComisionRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public ComisionRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Comisión vigente = la que cubre la fecha de hoy (solo hay una vigente por momento).
    public async Task<ComisionVigenteDto?> GetVigenteAsync()
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // buscamos la comisión vigente de hoy, si hay varias vigentes se toma la que tenga una fecha_inicio más reciente.
        await using var cmd = new NpgsqlCommand(@"
            SELECT id_comision, porcentaje
            FROM comision
            WHERE fecha_inicio <= CURRENT_DATE
              AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
            ORDER BY fecha_inicio DESC
            LIMIT 1;", connection);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        return new ComisionVigenteDto
        {
            IdComision = reader.GetInt32(reader.GetOrdinal("id_comision")),
            Porcentaje = reader.GetDecimal(reader.GetOrdinal("porcentaje")),
        };
    }
}
