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

    // Obtiene los sectores habilitados de un encuentro y sus funcionarios asignados
    public async Task<IReadOnlyCollection<TrabajaEnDto>> GetByEncuentroAsync(int encuentroId)
    {
        var asignaciones = new List<TrabajaEnDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // LEFT JOIN permite mostrar también sectores que todavía no tienen funcionario
        await using var command = new NpgsqlCommand(
            @"SELECT
                te.funcionario_mail,
                h.id AS fk_habilita_id,
                s.id_sector,
                s.nombre AS sector_nombre,
                p.nombre AS nombre_funcionario,
                p.apellido AS apellido_funcionario
            FROM habilita h
            JOIN sector s ON h.fk_sector = s.id_sector
            LEFT JOIN trabaja_en te ON te.fk_habilita_id = h.id
            LEFT JOIN persona p ON te.funcionario_mail = p.mail
            WHERE h.fk_encuentro = @encuentroId
            ORDER BY s.nombre, p.apellido, p.nombre;", connection);

        command.Parameters.AddWithValue("@encuentroId", encuentroId);

        await using var reader = await command.ExecuteReaderAsync();

        // Convierte cada fila obtenida a un DTO de asignación
        while (await reader.ReadAsync())
        {
            asignaciones.Add(new TrabajaEnDto
            {
                FuncionarioMail = reader.IsDBNull(reader.GetOrdinal("funcionario_mail"))
                    ? ""
                    : reader.GetString(reader.GetOrdinal("funcionario_mail")),

                HabilitaId = reader.GetInt32(reader.GetOrdinal("fk_habilita_id")),

                SectorId = reader.GetInt32(reader.GetOrdinal("id_sector")),

                SectorNombre = reader.GetString(reader.GetOrdinal("sector_nombre")),

                NombreFuncionario = reader.IsDBNull(reader.GetOrdinal("nombre_funcionario"))
                    ? ""
                    : reader.GetString(reader.GetOrdinal("nombre_funcionario")),

                ApellidoFuncionario = reader.IsDBNull(reader.GetOrdinal("apellido_funcionario"))
                    ? ""
                    : reader.GetString(reader.GetOrdinal("apellido_funcionario"))
            });
        }

        return asignaciones;
    }

    // Crea una nueva relación entre un funcionario y una habilitación
    public async Task<bool> CreateAsync(CrearTrabajaEnDto asignacion)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // ON CONFLICT evita duplicar una asignación ya existente
        await using var command = new NpgsqlCommand(
            @"INSERT INTO trabaja_en (funcionario_mail, fk_habilita_id)
            VALUES (@funcionarioMail, @habilitaId)
            ON CONFLICT DO NOTHING;", connection);

        command.Parameters.AddWithValue("@funcionarioMail", asignacion.FuncionarioMail);
        command.Parameters.AddWithValue("@habilitaId", asignacion.HabilitaId);

        var affectedRows = await command.ExecuteNonQueryAsync();

        return affectedRows > 0;
    }

    // Elimina la relación de un funcionario con una habilitación específica
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