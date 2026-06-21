using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class TrabajaEnRepository : ITrabajaEnRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public TrabajaEnRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyCollection<TrabajaEnDto>> GetByEncuentroAsync(int encuentroId)
    {
        var asignaciones = new List<TrabajaEnDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT
                te.funcionario_mail,
                te.fk_habilita_id,
                s.id_sector,
                s.nombre AS sector_nombre,
                p.nombre AS nombre_funcionario,
                p.apellido AS apellido_funcionario
            FROM trabaja_en te
            JOIN habilita h ON te.fk_habilita_id = h.id
            JOIN sector s ON h.fk_sector = s.id_sector
            JOIN persona p ON te.funcionario_mail = p.mail
            WHERE h.fk_encuentro = @encuentroId
            ORDER BY s.nombre, p.apellido, p.nombre;", connection);

        command.Parameters.AddWithValue("@encuentroId", encuentroId);

        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            asignaciones.Add(new TrabajaEnDto
            {
                FuncionarioMail = reader.GetString(reader.GetOrdinal("funcionario_mail")),
                HabilitaId = reader.GetInt32(reader.GetOrdinal("fk_habilita_id")),
                SectorId = reader.GetInt32(reader.GetOrdinal("id_sector")),
                SectorNombre = reader.GetString(reader.GetOrdinal("sector_nombre")),
                NombreFuncionario = reader.GetString(reader.GetOrdinal("nombre_funcionario")),
                ApellidoFuncionario = reader.GetString(reader.GetOrdinal("apellido_funcionario"))
            });
        }

        return asignaciones;
    }

    public async Task<bool> CreateAsync(CrearTrabajaEnDto asignacion)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"INSERT INTO trabaja_en (funcionario_mail, fk_habilita_id)
            VALUES (@funcionarioMail, @habilitaId)
            ON CONFLICT DO NOTHING;", connection);

        command.Parameters.AddWithValue("@funcionarioMail", asignacion.FuncionarioMail);
        command.Parameters.AddWithValue("@habilitaId", asignacion.HabilitaId);

        var affectedRows = await command.ExecuteNonQueryAsync();

        return affectedRows > 0;
    }

    public async Task<bool> DeleteAsync(string funcionarioMail, int habilitaId)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"DELETE FROM trabaja_en
            WHERE funcionario_mail = @funcionarioMail
            AND fk_habilita_id = @habilitaId;", connection);

        command.Parameters.AddWithValue("@funcionarioMail", funcionarioMail);
        command.Parameters.AddWithValue("@habilitaId", habilitaId);

        var affectedRows = await command.ExecuteNonQueryAsync();

        return affectedRows > 0;
    }
}