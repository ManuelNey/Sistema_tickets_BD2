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
                   s.nombre                                    AS sector,
                   h.precio                                    AS precio,
                   (s.capacidad_maxima - COUNT(e.id_entrada))::int AS disponibles
            FROM habilita h
            JOIN sector s        ON h.fk_sector     = s.id_sector
            LEFT JOIN entrada e  ON e.fk_habilita_id = h.id
            WHERE h.fk_encuentro = @idEncuentro
            GROUP BY h.id, s.nombre, h.precio, s.capacidad_maxima
            ORDER BY h.precio DESC", connection);

        cmd.Parameters.AddWithValue("@idEncuentro", idEncuentro);

        var sectores = new List<SectorDisponibleDto>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            sectores.Add(new SectorDisponibleDto
            {
                IdHabilita  = reader.GetInt32(reader.GetOrdinal("id_habilita")),
                Sector      = reader.GetString(reader.GetOrdinal("sector")),
                Precio      = reader.GetDecimal(reader.GetOrdinal("precio")),
                Disponibles = reader.GetInt32(reader.GetOrdinal("disponibles"))
            });
        }

        return sectores;
    }

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
                est.fk_pais_sede
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
                Pais = reader.GetInt32(reader.GetOrdinal("fk_pais_sede"))
            } 
            );
        }

        return encuentros;
        
    }

    public async Task<EncuentroDto?> CreateAsync(CrearEncuentroDto encuentro, string mailAdmin, int paisSedeId)
{
    await using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();

    await using var transaction = await connection.BeginTransactionAsync();

    //Valido que el admin haga encuentros sólo en los estadio de su país
    await using var checkCommand = new NpgsqlCommand(
        @"SELECT COUNT(*)
        FROM estadio
        WHERE id_estadio= @EstadioId
        AND fk_pais_sede = @PaisSedeId;", connection, transaction
    );

    checkCommand.Parameters.AddWithValue("@EstadioId", encuentro.EstadioId);
    checkCommand.Parameters.AddWithValue("@PaisSedeId",paisSedeId);

    var count = Convert.ToInt64(await checkCommand.ExecuteScalarAsync());

    if(count == 0)
    {
        await transaction.RollbackAsync();
        return null;
    }

    //Si el pais del estadio coincide con el del admin, 
    // entonces se hacen los insert en encuentros y habilita

    try
    {
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
                RETURNING id_encuentro, fecha, fk_equipo_local, fk_equipo_visitante, fk_estadio;", 
            connection,
            transaction);

        cmd.Parameters.AddWithValue("@Fecha", encuentro.Fecha);
        cmd.Parameters.AddWithValue("@EquipoLocal", encuentro.EquipoLocalId);
        cmd.Parameters.AddWithValue("@EquipoVisitante", encuentro.EquipoVisitanteId);
        cmd.Parameters.AddWithValue("@Estadio", encuentro.EstadioId);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            throw new InvalidOperationException("No se pudo crear el encuentro.");
        }

        var encuentroCreado = new EncuentroDto
        {
            Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
            Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
            EquipoLocal = reader.GetInt32(reader.GetOrdinal("fk_equipo_local")),
            EquipoVisitante = reader.GetInt32(reader.GetOrdinal("fk_equipo_visitante")),
            Estadio = reader.GetInt32(reader.GetOrdinal("fk_estadio"))
        };

        await reader.DisposeAsync();

        foreach (var sector in encuentro.Sectores)
        {
            await using var cmdSector = new NpgsqlCommand(
                @"INSERT INTO habilita(
                    fk_encuentro,
                    fk_sector,
                    fk_sector_estadio,
                    precio,
                    fk_administrador_mail)
                    VALUES(
                    @IdEncuentro,
                    @IdSector,
                    @IdEstadio,
                    @Precio,
                    @MailAdmin);",connection,transaction);

            cmdSector.Parameters.AddWithValue("@IdEncuentro", encuentroCreado.Id);
            cmdSector.Parameters.AddWithValue("@IdSector", sector.SectorId);
            cmdSector.Parameters.AddWithValue("@IdEstadio", encuentroCreado.Estadio);
            cmdSector.Parameters.AddWithValue("@Precio", sector.Precio);
            cmdSector.Parameters.AddWithValue("@MailAdmin", mailAdmin);

            await cmdSector.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();

        return encuentroCreado;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
}

