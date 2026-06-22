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

    public async Task<IReadOnlyCollection<ComisionDto>> GetAllAsync()
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT id_comision, porcentaje, fecha_inicio, fecha_fin
            FROM comision
            ORDER BY fecha_inicio DESC;", connection);

        await using var reader = await cmd.ExecuteReaderAsync();

        var result = new List<ComisionDto>();
        while (await reader.ReadAsync())
        {
            result.Add(new ComisionDto
            {
                Id         = reader.GetInt32(reader.GetOrdinal("id_comision")),
                Porcentaje = reader.GetDecimal(reader.GetOrdinal("porcentaje")),
                FechaInicio = reader.GetFieldValue<DateOnly>(reader.GetOrdinal("fecha_inicio")),
                FechaFin    = reader.IsDBNull(reader.GetOrdinal("fecha_fin"))
                                ? null
                                : reader.GetFieldValue<DateOnly>(reader.GetOrdinal("fecha_fin")),
            });
        }

        return result;
    }

    public async Task CreateAsync(CrearComisionDto dto)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO comision (porcentaje, fecha_inicio, fecha_fin)
            VALUES (@porcentaje, @fechaInicio, @fechaFin);", connection);

        cmd.Parameters.AddWithValue("@porcentaje",   dto.Porcentaje);
        cmd.Parameters.AddWithValue("@fechaInicio",  dto.FechaInicio);
        cmd.Parameters.AddWithValue("@fechaFin",
            dto.FechaFin.HasValue ? dto.FechaFin.Value : DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }

    // null = no existe, false = tiene compras asociadas y true = borrada OK.
    public async Task<bool?> DeleteAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Verificar que existe como tal
        await using var existsCmd = new NpgsqlCommand(
            "SELECT 1 FROM comision WHERE id_comision = @id;", connection);
        existsCmd.Parameters.AddWithValue("@id", id);
        var exists = await existsCmd.ExecuteScalarAsync();
        if (exists is null) return null;

        // Verificar que no está referenciada por ninguna compra
        await using var usedCmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM compra WHERE fk_comision = @id;", connection);
        usedCmd.Parameters.AddWithValue("@id", id);
        var count = (long)(await usedCmd.ExecuteScalarAsync())!;
        if (count > 0) return false;

        await using var deleteCmd = new NpgsqlCommand(
            "DELETE FROM comision WHERE id_comision = @id;", connection);
        deleteCmd.Parameters.AddWithValue("@id", id);
        await deleteCmd.ExecuteNonQueryAsync();

        return true;
    }
}
