using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class EncuentroRepository : IEncuentroRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public EncuentroRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Lista todos los sectores habilitados para un encuentro, con su precio y cupos disponibles.
    public async Task<IReadOnlyCollection<SectorDisponibleDto>> GetSectoresByEncuentroAsync(int idEncuentro)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT h.id                                        AS id_habilita,
                    s.id_sector                                 AS sector_id,
                    s.nombre                                    AS sector,
                    h.precio                                    AS precio,
                    (s.capacidad_maxima - COUNT(e.id_entrada))::int AS disponibles
            FROM habilita h
            JOIN sector s        ON h.fk_sector     = s.id_sector
            LEFT JOIN entrada e  ON e.fk_habilita_id = h.id
            WHERE h.fk_encuentro = @idEncuentro
            GROUP BY h.id, s.id_sector, s.nombre, h.precio, s.capacidad_maxima
            ORDER BY h.precio DESC", connection);

        cmd.Parameters.AddWithValue("@idEncuentro", idEncuentro);

        var sectores = new List<SectorDisponibleDto>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            sectores.Add(new SectorDisponibleDto
            {
                IdHabilita  = reader.GetInt32(reader.GetOrdinal("id_habilita")),
                SectorId   = reader.GetInt32(reader.GetOrdinal("sector_id")),
                Sector      = reader.GetString(reader.GetOrdinal("sector")),
                Precio      = reader.GetDecimal(reader.GetOrdinal("precio")),
                Disponibles = reader.GetInt32(reader.GetOrdinal("disponibles"))
            });
        }

        return sectores;
    }

     // Devuelve todos los encuentros registrados.
    public async Task<IReadOnlyCollection<EncuentroDto>> GetAllEncuentros()
        {
            await using var connection = _connectionFactory.CreateConnection();
            await connection.OpenAsync();

            await using var cmd = new NpgsqlCommand(
                @"SELECT 
                    e.id_encuentro,
                    e.fecha,
                    e.fk_equipo_local,
                    e.fk_equipo_visitante,
                    e.fk_estadio,
                    est.fk_pais_sede,
                    e.estado
                FROM encuentro e
                JOIN estadio est 
                    ON e.fk_estadio = est.id_estadio;", connection);

            var encuentros= new List<EncuentroDto>();
            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                encuentros.Add(new EncuentroDto
                {
                    Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
                    Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
                    EquipoLocal = reader.GetInt32(reader.GetOrdinal("fk_equipo_local")),
                    EquipoVisitante = reader.GetInt32(reader.GetOrdinal("fk_equipo_visitante")),
                    Estadio = reader.GetInt32(reader.GetOrdinal("fk_estadio")),
                    Pais = reader.GetInt32(reader.GetOrdinal("fk_pais_sede")),
                    Estado = reader.GetString(reader.GetOrdinal("estado"))
                } 
                );
            }

            return encuentros;
            
        }

        // Crea un nuevo encuentro y habilita los sectores seleccionados.
        // También valida reglas de negocio antes de insertar.
        public async Task<EncuentroDto?> CreateAsync(CrearEncuentroDto encuentro, string mailAdmin, int paisSedeId)
        {
            // Valida que el equipo local y visitante no sean el mismo.
            if (encuentro.EquipoLocalId == encuentro.EquipoVisitanteId)
            {
                throw new InvalidOperationException("El equipo local y el visitante no pueden ser el mismo.");
            }
            await using var connection = _connectionFactory.CreateConnection();
            await connection.OpenAsync();

            // Se utiliza una transacción para asegurar que el encuentro y sus sectores
            // se creen juntos. Si algo falla, no se guarda nada parcialmente.
            await using var transaction = await connection.BeginTransactionAsync();

            try
            {
                // Valida que el estadio pertenezca al país sede del administrador.
                // Si no pertenece, se devuelve null para que el controller responda Forbid.
                await using var checkCommand = new NpgsqlCommand(
                    @"SELECT COUNT(*)
                    FROM estadio
                    WHERE id_estadio = @EstadioId
                    AND fk_pais_sede = @PaisSedeId;",
                    connection,
                    transaction);

                checkCommand.Parameters.AddWithValue("@EstadioId", encuentro.EstadioId);
                checkCommand.Parameters.AddWithValue("@PaisSedeId", paisSedeId);

                var count = Convert.ToInt64(await checkCommand.ExecuteScalarAsync());

                if (count == 0)
                {
                    await transaction.RollbackAsync();
                    return null;
                }

                // Valido que no haya otro encuentro en el mismo estadio dentro del rango de 4 horas.
                await using var checkHorarioCommand = new NpgsqlCommand(
                    @"SELECT COUNT(*)
                    FROM encuentro
                    WHERE fk_estadio = @idEstadio
                    AND fecha >= @fecha - interval '4 hours'
                    AND fecha < @fecha + interval '4 hours';",
                    connection,
                    transaction);

                checkHorarioCommand.Parameters.AddWithValue("@idEstadio", encuentro.EstadioId);
                checkHorarioCommand.Parameters.AddWithValue("@fecha", encuentro.Fecha);

                var encuentrosEnRango = Convert.ToInt64(await checkHorarioCommand.ExecuteScalarAsync());

                if (encuentrosEnRango > 0)
                {
                    throw new InvalidOperationException("Ya existe un encuentro en ese estadio dentro de un rango de 4 horas.");
                }

                // Valido que ninguno de los equipos/paises juegue otro encuentro dentro del rango de 4 horas.
                await using var checkEquiposCommand = new NpgsqlCommand(
                    @"SELECT COUNT(*)
                    FROM encuentro
                    WHERE fecha >= @fecha - interval '4 hours'
                    AND fecha < @fecha + interval '4 hours'
                    AND (
                        fk_equipo_local = @equipoLocal
                        OR fk_equipo_visitante = @equipoLocal
                        OR fk_equipo_local = @equipoVisitante
                        OR fk_equipo_visitante = @equipoVisitante
                    );",
                    connection,
                    transaction);

                checkEquiposCommand.Parameters.AddWithValue("@fecha", encuentro.Fecha);
                checkEquiposCommand.Parameters.AddWithValue("@equipoLocal", encuentro.EquipoLocalId);
                checkEquiposCommand.Parameters.AddWithValue("@equipoVisitante", encuentro.EquipoVisitanteId);

                var equiposEnRango = Convert.ToInt64(await checkEquiposCommand.ExecuteScalarAsync());

                if (equiposEnRango > 0)
                {
                    throw new InvalidOperationException("Uno de los equipos ya tiene un encuentro dentro de un rango de 4 horas.");
                }

                // Si esta todo OK, creo el encuentro.
                await using var cmd = new NpgsqlCommand(
                    @"INSERT INTO encuentro(
                        fecha,
                        fk_equipo_local,
                        fk_equipo_visitante,
                        fk_estadio,
                        estado)
                    VALUES(
                        @Fecha,
                        @EquipoLocal,
                        @EquipoVisitante,
                        @Estadio,
                        'programado')
                    RETURNING id_encuentro, fecha, fk_equipo_local, fk_equipo_visitante, fk_estadio, estado;",
                    connection,
                    transaction);

                cmd.Parameters.AddWithValue("@Fecha", encuentro.Fecha);
                cmd.Parameters.AddWithValue("@EquipoLocal", encuentro.EquipoLocalId);
                cmd.Parameters.AddWithValue("@EquipoVisitante", encuentro.EquipoVisitanteId);
                cmd.Parameters.AddWithValue("@Estadio", encuentro.EstadioId);

                await using var reader = await cmd.ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    await transaction.RollbackAsync();
                    return null;
                }

                var encuentroCreado = new EncuentroDto
                {
                    Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
                    Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
                    EquipoLocal = reader.GetInt32(reader.GetOrdinal("fk_equipo_local")),
                    EquipoVisitante = reader.GetInt32(reader.GetOrdinal("fk_equipo_visitante")),
                    Estadio = reader.GetInt32(reader.GetOrdinal("fk_estadio")),
                    Estado = reader.GetString(reader.GetOrdinal("estado")),
                    Pais = paisSedeId
                };

                await reader.DisposeAsync();

                // Se recorren los sectores seleccionados por el administrador.
                foreach (var sector in encuentro.Sectores)
                {
                    // Valido que el sector pertenezca al estadio del encuentro.
                    await using var checkSectorCommand = new NpgsqlCommand(
                        @"SELECT COUNT(*)
                        FROM sector
                        WHERE id_sector = @IdSector
                        AND fk_estadio = @IdEstadio;",
                        connection,
                        transaction);

                    checkSectorCommand.Parameters.AddWithValue("@IdSector", sector.SectorId);
                    checkSectorCommand.Parameters.AddWithValue("@IdEstadio", encuentroCreado.Estadio);

                    var sectorCount = Convert.ToInt64(await checkSectorCommand.ExecuteScalarAsync());

                    if (sectorCount == 0)
                    {
                        throw new InvalidOperationException("Uno de los sectores seleccionados no pertenece al estadio del encuentro.");
                    }

                    await using var cmdSector = new NpgsqlCommand(
                        @"INSERT INTO habilita(
                            fk_encuentro,
                            fk_sector,
                            precio,
                            fk_administrador_mail)
                        VALUES(
                            @IdEncuentro,
                            @IdSector,
                            @Precio,
                            @MailAdmin);",
                        connection,
                        transaction);

                    cmdSector.Parameters.AddWithValue("@IdEncuentro", encuentroCreado.Id);
                    cmdSector.Parameters.AddWithValue("@IdSector", sector.SectorId);
                    cmdSector.Parameters.AddWithValue("@Precio", sector.Precio);
                    cmdSector.Parameters.AddWithValue("@MailAdmin", mailAdmin);

                    await cmdSector.ExecuteNonQueryAsync();
                }
                // Si todo salió bien, confirma la transacción.
                await transaction.CommitAsync();

                return encuentroCreado;
            }
            catch
            {
                // Si ocurre cualquier error, revierte los cambios realizados.
                await transaction.RollbackAsync();
                throw;
            }
        }

    // Actualiza los datos o el estado de un encuentro existente.
    public async Task<EncuentroDto?> UpdateAsync(int id, ActualizarEncuentroDto encuentro, int paisSedeId, string mailAdmin)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Se obtiene el estado actual del encuentro
        await using var estadoCommand = new NpgsqlCommand(
            @"SELECT estado
            FROM encuentro
            WHERE id_encuentro = @idEncuentro;",
            connection);

        estadoCommand.Parameters.AddWithValue("@idEncuentro", id);

        var estadoActual = (string?)await estadoCommand.ExecuteScalarAsync();

        if (estadoActual == null)
        {
            return null;
        }

        if (estadoActual == "finalizado")
        {
            return null;
        }

        if (estadoActual == "cancelado" && encuentro.Estado != "programado")
        {
            return null;
        }

        if (estadoActual == "en_juego" && encuentro.Estado != "finalizado")
        {
            return null;
        }

        if (estadoActual == "programado" &&
            encuentro.Estado != "programado" &&
            encuentro.Estado != "en_juego" &&
            encuentro.Estado != "cancelado")
        {
            return null;
        }

        // Si el encuentro está en juego, solo se permite pasarlo a finalizado.
        if (estadoActual == "en_juego")
        {
            await using var command = new NpgsqlCommand(
                @"UPDATE encuentro
                SET estado = @nuevoEstado
                WHERE id_encuentro = @idEncuentro
                AND estado = 'en_juego'
                RETURNING id_encuentro, fecha, fk_equipo_local, fk_equipo_visitante, fk_estadio, estado;",
                connection);

            command.Parameters.AddWithValue("@nuevoEstado", encuentro.Estado);
            command.Parameters.AddWithValue("@idEncuentro", id);

            await using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return null;
            }

            return new EncuentroDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
                Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
                EquipoLocal = reader.GetInt32(reader.GetOrdinal("fk_equipo_local")),
                EquipoVisitante = reader.GetInt32(reader.GetOrdinal("fk_equipo_visitante")),
                Estadio = reader.GetInt32(reader.GetOrdinal("fk_estadio")),
                Estado = reader.GetString(reader.GetOrdinal("estado"))
            };
        }

        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            //Si el pási del admin no coincide con el pais del estadio, entonces no se modifica
            await using var command = new NpgsqlCommand(
                @"UPDATE encuentro e
                SET
                    estado = @nuevoEstado,
                    fecha = @nuevaFecha,
                    fk_estadio = @nuevoEstadioId
                FROM estadio s
                WHERE @nuevoEstadioId = s.id_estadio
                AND e.id_encuentro = @idEncuentro
                AND s.fk_pais_sede = @paisSedeId
                AND e.estado IN ('programado', 'cancelado')
                RETURNING 
                    e.id_encuentro,
                    e.estado,
                    e.fecha,
                    e.fk_equipo_local,
                    e.fk_equipo_visitante,
                    e.fk_estadio,
                    s.fk_pais_sede;", connection,transaction);

            command.Parameters.AddWithValue("@nuevoEstado", encuentro.Estado);
            command.Parameters.AddWithValue("@nuevaFecha", encuentro.Fecha);
            command.Parameters.AddWithValue("@nuevoEstadioId", encuentro.EstadioId);
            command.Parameters.AddWithValue("@paisSedeId", paisSedeId);
            command.Parameters.AddWithValue("@idEncuentro", id);

            await using var reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                await transaction.RollbackAsync();
                return null;
            }

            var encuentroActualizado = new EncuentroDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
                Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
                EquipoLocal = reader.GetInt32(reader.GetOrdinal("fk_equipo_local")),
                EquipoVisitante = reader.GetInt32(reader.GetOrdinal("fk_equipo_visitante")),
                Estadio = reader.GetInt32(reader.GetOrdinal("fk_estadio")),
                Estado = reader.GetString(reader.GetOrdinal("estado")),
                Pais = reader.GetInt32(reader.GetOrdinal("fk_pais_sede"))
            };

            await reader.DisposeAsync();

            foreach (var sector in encuentro.Sectores)
            {
                //Ver si el sector ya está habilitado para ese encuentro o no
                await using var cmdSectorExists= new NpgsqlCommand(
                    @"SELECT COUNT(*) 
                    FROM habilita
                    WHERE fk_sector=@idSector
                    AND fk_encuentro=@idEncuentro;",
                connection,transaction);

                cmdSectorExists.Parameters.AddWithValue("@idSector", sector.SectorId);
                cmdSectorExists.Parameters.AddWithValue("@idEncuentro", encuentroActualizado.Id);

                var count = Convert.ToInt64(await cmdSectorExists.ExecuteScalarAsync());

                //Ver si el sector pertenece al estadio del encuentro
                await using var cmdSectorEstadio= new NpgsqlCommand(
                    @"SELECT COUNT(*)
                    FROM sector
                    where id_sector=@idSector and fk_estadio=@idEstadio;",
                    connection,transaction);

                cmdSectorEstadio.Parameters.AddWithValue("@idSector", sector.SectorId);
                cmdSectorEstadio.Parameters.AddWithValue("@idEstadio", encuentroActualizado.Estadio);

                var count2 = Convert.ToInt64(await cmdSectorEstadio.ExecuteScalarAsync());

                if (count2==0)
                {
                    await transaction.RollbackAsync();
                    return null;
                }

                //Si ese sector no estaba para ese encuentro entonces inserto en la tabla de habilita ese sector con su precio
                if(count == 0)
                {
                    await using var cmdSector= new NpgsqlCommand(
                        @"INSERT INTO habilita(
                        fk_encuentro,
                        fk_sector,
                        precio,
                        fk_administrador_mail)
                        VALUES(
                        @IdEncuentro,
                        @IdSector,
                        @Precio,
                        @MailAdmin);",connection,transaction
                    );

                    cmdSector.Parameters.AddWithValue("@IdEncuentro", encuentroActualizado.Id);
                    cmdSector.Parameters.AddWithValue("@IdSector", sector.SectorId);
                    cmdSector.Parameters.AddWithValue("@Precio", sector.Precio);
                    cmdSector.Parameters.AddWithValue("@MailAdmin", mailAdmin);

                    await cmdSector.ExecuteNonQueryAsync();
                }

                //Si ya estaba, entonces sólo hago un UPDATE del precio
                if(count>=1){
                    await using var cmdSector = new NpgsqlCommand(
                        @"UPDATE habilita
                        SET precio=@nuevoPrecio
                        WHERE fk_sector=@IdSector
                        AND fk_encuentro = @IdEncuentro
                        RETURNING fk_sector,precio;"
                        ,connection,transaction);

                    cmdSector.Parameters.AddWithValue("@nuevoPrecio", sector.Precio);
                    cmdSector.Parameters.AddWithValue("@IdSector", sector.SectorId);
                    cmdSector.Parameters.AddWithValue("@IdEncuentro", encuentroActualizado.Id);

                    await cmdSector.ExecuteNonQueryAsync();
                }
            }

            await transaction.CommitAsync();

            return encuentroActualizado;
        }

        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
        
    }

    // Devuelve el detalle completo de un encuentro por id.
    public async Task<EncuentroDetalleDto> GetEncuentroById(int idEncuentro)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
        SELECT
            n.id_encuentro,
            n.fecha,
            n.estado,
            n.fk_equipo_local,
            local.pais AS pais_local,
            n.fk_equipo_visitante,
            visitante.pais AS pais_visitante,
            n.fk_estadio,
            s.nombre AS estadio_nombre,
            s.ciudad AS estadio_ciudad,
            p.nombre AS pais_sede_nombre,
            p.id_pais_sede
        FROM encuentro n
        JOIN estadio s
            ON n.fk_estadio = s.id_estadio
        JOIN equipo local
            ON n.fk_equipo_local = local.id_equipo
        JOIN equipo visitante
            ON n.fk_equipo_visitante = visitante.id_equipo
        JOIN pais_sede p
            ON s.fk_pais_sede = p.id_pais_sede
        WHERE n.id_encuentro = @idEncuentro;
        ", connection);

        cmd.Parameters.AddWithValue("@idEncuentro", idEncuentro);

        await using var reader = await cmd.ExecuteReaderAsync();
        
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new EncuentroDetalleDto
        {
            Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
            Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
            Estado = reader.GetString(reader.GetOrdinal("estado")),
            
            EquipoLocalId = reader.GetInt32(reader.GetOrdinal("fk_equipo_local")),
            EquipoLocalNombre = reader.GetString(reader.GetOrdinal("pais_local")),
            EquipoVisitanteId = reader.GetInt32(reader.GetOrdinal("fk_equipo_visitante")),
            EquipoVisitanteNombre = reader.GetString(reader.GetOrdinal("pais_visitante")),

            EstadioId = reader.GetInt32(reader.GetOrdinal("fk_estadio")),
            EstadioNombre = reader.GetString(reader.GetOrdinal("estadio_nombre")),
            CiudadEstadio= reader.GetString(reader.GetOrdinal("estadio_ciudad")),

            PaisId= reader.GetInt32(reader.GetOrdinal("id_pais_sede")),
            PaisNombre= reader.GetString(reader.GetOrdinal("pais_sede_nombre"))
        };
    }
}
