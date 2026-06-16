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

    // "Mis Entradas": entradas que el usuario posee ahora (fk_usuario_mail = mail),
    // agrupadas por partido + sector (habilita). Solo estados 'activa' (disponible) y
    // 'transferida' (enviada, pendiente de aceptación); las 'utilizada'/'reservada' quedan afuera.
    public async Task<List<MisEntradasGrupoDto>> GetMisEntradasAsync(string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // FILTER (WHERE ...) nos deja contar por estado en una sola pasada.
        await using var cmd = new NpgsqlCommand(@"
            SELECT
                h.id        AS id_habilita,
                el.pais     AS equipo_local,
                ev.pais     AS equipo_visitante,
                en.fecha    AS fecha_encuentro,
                es.nombre   AS estadio,
                es.ciudad   AS ciudad,
                s.nombre    AS sector,
                COUNT(*) FILTER (WHERE e.estado = 'activa')        AS disponibles,
                COUNT(*) FILTER (WHERE e.estado = 'transferida')   AS transferidas
            FROM entrada e
            JOIN habilita h   ON e.fk_habilita_id       = h.id
            JOIN encuentro en ON h.fk_encuentro         = en.id_encuentro
            JOIN equipo   el  ON en.fk_equipo_local     = el.id_equipo
            JOIN equipo   ev  ON en.fk_equipo_visitante = ev.id_equipo
            JOIN estadio  es  ON en.fk_estadio          = es.id_estadio
            JOIN sector   s   ON h.fk_sector            = s.id_sector
            WHERE e.fk_usuario_mail = @mail
              AND e.estado IN ('activa', 'transferida')
            GROUP BY h.id, el.pais, ev.pais, en.fecha, es.nombre, es.ciudad, s.nombre
            ORDER BY en.fecha;", connection);
        cmd.Parameters.AddWithValue("@mail", mail);

        await using var reader = await cmd.ExecuteReaderAsync();

        var grupos = new List<MisEntradasGrupoDto>();
        while (await reader.ReadAsync())
        {
            var fechaEncuentro = reader.GetDateTime(reader.GetOrdinal("fecha_encuentro"));
            grupos.Add(new MisEntradasGrupoDto
            {
                IdHabilita      = reader.GetInt32(reader.GetOrdinal("id_habilita")),
                EquipoLocal     = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                FechaEncuentro  = DateOnly.FromDateTime(fechaEncuentro),
                HoraEncuentro   = TimeOnly.FromDateTime(fechaEncuentro),
                Estadio         = reader.GetString(reader.GetOrdinal("estadio")),
                Ciudad          = reader.GetString(reader.GetOrdinal("ciudad")),
                Sector          = reader.GetString(reader.GetOrdinal("sector")),
                Disponibles     = (int)reader.GetInt64(reader.GetOrdinal("disponibles")),
                Transferidas    = (int)reader.GetInt64(reader.GetOrdinal("transferidas")),
            });
        }

        return grupos;
    }

    // Realiza la solicitud de transferencia con la cantidad de entradas de una habilitacioón
    // El back selecciona las ids de las entradas y bloquea la cantidad de entradas disponibles
    // luego se inserta una transferencia 'pendiente' por cada entrada. 
    // El trigger pasa cada entrada a 'transferida'.
    // Devuelve cuántas entradas se enviaron por si el front quiere mostrar la cantidad
    public async Task<int> TransferirAsync(int idHabilita, int cantidad, string emisorMail, string receptorMail)
{
    if (cantidad < 1)
        throw new InvalidOperationException("La cantidad a transferir debe ser de al menos 1");

    if (string.Equals(receptorMail, emisorMail, StringComparison.OrdinalIgnoreCase))
        throw new InvalidOperationException("No podés enviarte una entrada a vos mismo");

    await using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();

    await using var transaction = await connection.BeginTransactionAsync();

    try
    {
        // Verificar que el receptor exista
        await using var cmdReceptor = new NpgsqlCommand(
            @"SELECT 1
              FROM usuario
              WHERE persona_mail = @receptor;",
            connection,
            transaction);

        cmdReceptor.Parameters.AddWithValue("receptor", receptorMail);

        if (await cmdReceptor.ExecuteScalarAsync() == null)
            throw new KeyNotFoundException("El destinatario no es un usuario registrado");

        // Obtener las entradas disponibles
        var listaIds = new List<int>();

        await using (var cmdSel = new NpgsqlCommand(@"
            SELECT id_entrada
            FROM entrada
            WHERE fk_habilita_id = @idHabilita
              AND fk_usuario_mail = @emisor
              AND estado = 'activa'
              AND cantidad_transferencias < 3
            ORDER BY id_entrada
            LIMIT @cantidad
            FOR UPDATE;",
            connection,
            transaction))
        {
            cmdSel.Parameters.AddWithValue("idHabilita", idHabilita);
            cmdSel.Parameters.AddWithValue("emisor", emisorMail);
            cmdSel.Parameters.AddWithValue("cantidad", cantidad);

            await using var reader = await cmdSel.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                listaIds.Add(reader.GetInt32(0));
            }
        }

        if (listaIds.Count < cantidad)
            throw new InvalidOperationException(
                "No tenés suficientes entradas disponibles para enviar");

        // Crear transferencias pendientes
        foreach (var idEntrada in listaIds)
        {
            await using var cmdIns = new NpgsqlCommand(@"
                INSERT INTO transferencia
                    (estado,
                     fk_usuario_mail_emisor,
                     fk_usuario_mail_receptor,
                     fk_entrada_id)
                VALUES
                    ('pendiente',
                     @emisor,
                     @receptor,
                     @idEntrada);",
                connection,
                transaction);

            cmdIns.Parameters.AddWithValue("emisor", emisorMail);
            cmdIns.Parameters.AddWithValue("receptor", receptorMail);
            cmdIns.Parameters.AddWithValue("idEntrada", idEntrada);

            await cmdIns.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();

        return listaIds.Count;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}

    public async Task<bool> MarcarEntradaComoUtilizadaAsync(int entradaId, string mailUsuario, string? mailFuncionario, string tokenUtilizado, string numeroDispositivo)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var transaction = await connection.BeginTransactionAsync();

        const string updateSql = @"
            UPDATE entrada SET estado = 'utilizada'
                WHERE id_entrada = @entradaId AND fk_usuario_mail = @mailUsuario AND estado = 'activa';
        ";

        await using var updateCommand = new NpgsqlCommand(updateSql, connection, transaction);
        updateCommand.Parameters.AddWithValue("@entradaId", entradaId);
        updateCommand.Parameters.AddWithValue("@mailUsuario", mailUsuario);

        var rowsAffected = await updateCommand.ExecuteNonQueryAsync();

        if (rowsAffected == 0)
        {
            await transaction.RollbackAsync();
            return false;
        }

        const string insertSql = @"
            INSERT INTO validacion (fecha, hora, token_utilizado, funcionario_mail, numero_dispositivo, entrada_id)
                VALUES (now(), CURRENT_TIME, @tokenUtilizado, @mailFuncionario, @numeroDispositivo, @entradaId);
        ";

        await using var insertCommand = new NpgsqlCommand(insertSql, connection, transaction);
        insertCommand.Parameters.AddWithValue("@tokenUtilizado", tokenUtilizado);
        insertCommand.Parameters.AddWithValue("@mailFuncionario", mailFuncionario ?? "");
        insertCommand.Parameters.AddWithValue("@numeroDispositivo", numeroDispositivo);
        insertCommand.Parameters.AddWithValue("@entradaId", entradaId);

        await insertCommand.ExecuteNonQueryAsync();

        await transaction.CommitAsync();

        return true;
    }
}