using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class EntradaRepository : IEntradaRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public EntradaRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<DisponibilidadDto?> GetDisponibilidadAsync(int idHabilita)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Consultamos la información del encuentro, estadio, equipos, precio y cupos disponibles para la columna de habilita.
        await using var cmd = new NpgsqlCommand(@"
            SELECT h.id, h.precio, s.capacidad_maxima,
                   COUNT(e.id_entrada)  AS entradas_vendidas,
                   eq_local.nombre      AS equipo_local,
                   eq_vis.nombre        AS equipo_visitante,
                   enc.fecha            AS fecha_encuentro,
                   est.nombre           AS nombre_estadio,
                   est.ciudad           AS ciudad_estadio,
                   s.nombre             AS nombre_sector
            FROM habilita h
            JOIN sector s          ON h.fk_sector             = s.id_sector
            JOIN encuentro enc     ON h.fk_encuentro          = enc.id_encuentro
            JOIN equipo eq_local   ON enc.fk_equipo_local     = eq_local.id_equipo
            JOIN equipo eq_vis     ON enc.fk_equipo_visitante  = eq_vis.id_equipo
            JOIN estadio est       ON enc.fk_estadio           = est.id_estadio
            LEFT JOIN entrada e    ON e.fk_habilita_id         = h.id
            WHERE h.id = @idHabilita
            GROUP BY h.id, h.precio, s.capacidad_maxima,
                     eq_local.nombre, eq_vis.nombre, enc.fecha,
                     est.nombre, est.ciudad, s.nombre", connection);

        cmd.Parameters.AddWithValue("@idHabilita", idHabilita);
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        var capacidad = reader.GetInt32(reader.GetOrdinal("capacidad_maxima"));
        var vendidas  = reader.GetInt32(reader.GetOrdinal("entradas_vendidas"));
        var fecha     = reader.GetDateTime(reader.GetOrdinal("fecha_encuentro"));

        return new DisponibilidadDto
        {
            IdHabilita      = idHabilita,
            EquipoLocal     = reader.GetString(reader.GetOrdinal("equipo_local")),
            EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
            FechaPartido    = DateOnly.FromDateTime(fecha),
            HoraPartido     = TimeOnly.FromDateTime(fecha),
            Estadio         = reader.GetString(reader.GetOrdinal("nombre_estadio")),
            Ciudad          = reader.GetString(reader.GetOrdinal("ciudad_estadio")),
            Sector          = reader.GetString(reader.GetOrdinal("nombre_sector")),
            Precio          = reader.GetDecimal(reader.GetOrdinal("precio")),
            Disponibles     = capacidad - vendidas
        };
    }


    
    public async Task<EntradaEstadoDto?> ObtenerEntrada(int idEntrada, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT id_entrada, estado 
            FROM entrada 
            WHERE id_entrada = @idEntrada
            AND fk_usuario_mail = @mail
        ", connection);

        cmd.Parameters.AddWithValue("@idEntrada", idEntrada);
        cmd.Parameters.AddWithValue("@mail", mail);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        return new EntradaEstadoDto
        {
            IdEntrada = reader.GetInt32(reader.GetOrdinal("id_entrada")),
            Estado = reader.GetString(reader.GetOrdinal("estado"))
        };
    }

    public async Task<IReadOnlyCollection<EntradaCodigoQrDto>> ObtenerEntradasQr(string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@" 
            SELECT e.id_entrada AS IdEntrada, equipo_local.nombre AS EquipoLocal, equipo_visitante.nombre AS EquipoVisitante,
                enc.fecha AS FechaEncuentro, s.nombre AS Sector, e.estado AS Estado
                FROM entrada e INNER JOIN habilita h ON h.id = e.fk_habilita_id 
                    INNER JOIN encuentro enc ON enc.id_encuentro = h.fk_encuentro
                    INNER JOIN equipo equipo_local ON equipo_local.id_equipo = enc.fk_equipo_local 
                    INNER JOIN equipo equipo_visitante ON equipo_visitante.id_equipo = enc.fk_equipo_visitante
                    INNER JOIN sector s ON s.id_sector = h.fk_sector
                        WHERE e.estado = 'activa' AND e.fk_usuario_mail = @mail 
                        ORDER BY enc.fecha, e.id_entrada;
            ", connection);
        cmd.Parameters.AddWithValue("@mail", mail);
        await using var reader = await cmd.ExecuteReaderAsync();

        var entradas = new List<EntradaCodigoQrDto>();

    while (await reader.ReadAsync())
    {
        entradas.Add(new EntradaCodigoQrDto
        {
            IdEntrada = reader.GetInt32(reader.GetOrdinal("identrada")),
            EquipoLocal = reader.GetString(reader.GetOrdinal("equipolocal")),
            EquipoVisitante = reader.GetString(reader.GetOrdinal("equipovisitante")),
            FechaEncuentro = reader.GetDateTime(reader.GetOrdinal("fechaencuentro")),
            Sector = reader.GetString(reader.GetOrdinal("sector")),
            Estado = reader.GetString(reader.GetOrdinal("estado"))
        });
    }

    return entradas;
    }

    public async Task<bool> MarcarEntradaComoUtilizadaAsync(int entradaId, string mailUsuario, string? mailFuncionario)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = @"
            UPDATE entrada
            SET estado = 'utilizada'
            WHERE id_entrada = @entradaId
            AND fk_usuario_mail = @mailUsuario
            AND estado = 'activa';
        ";

        using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@entradaId", entradaId);
        command.Parameters.AddWithValue("@mailUsuario", mailUsuario);

        var rowsAffected = await command.ExecuteNonQueryAsync();

        return rowsAffected > 0;
    }
}