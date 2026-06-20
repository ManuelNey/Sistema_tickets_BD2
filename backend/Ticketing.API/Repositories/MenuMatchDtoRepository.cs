using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class MenuMatchDtoRepository : IMenuMatchDtoRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public MenuMatchDtoRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene el menú de partidos disponibles, con información de estadio, equipos, fecha, precios y cupos disponibles.
    // Admite filtros opcionales por equipo (local o visitante) y por estadio.
    public async Task<IReadOnlyCollection<EncuentroMenuDto>> GetMenuMatchesAsync(int? equipoId = null, int? estadioId = null)
    {
        var menuMatches = new List<EncuentroMenuDto>();

        try
        {
            await using var connection = _connectionFactory.CreateConnection();
            await connection.OpenAsync();

            var whereExtras = new System.Text.StringBuilder();
            if (equipoId.HasValue)
                whereExtras.Append(" AND (ex.fk_equipo_local = @equipoId OR ex.fk_equipo_visitante = @equipoId)");
                // Posibilidad de filtrar por equipo
            if (estadioId.HasValue)
                whereExtras.Append(" AND ex.fk_estadio = @estadioId");
                // Posibilidad de filtrar por estadio

            await using var command = new NpgsqlCommand(
            $@"WITH capacidad AS (
                        SELECT
                            h.fk_encuentro,
                            SUM(s.capacidad_maxima) AS capacidad_total
                        FROM habilita h
                        JOIN sector s
                            ON s.id_sector = h.fk_sector
                        GROUP BY h.fk_encuentro
                    ),
                    ventas AS (
                        SELECT
                            h.fk_encuentro,
                            COUNT(e.id_entrada) AS entradas_vendidas
                        FROM habilita h
                        LEFT JOIN entrada e
                            ON e.fk_habilita_id = h.id
                        GROUP BY h.fk_encuentro
                    )
                    SELECT
                        ex.id_encuentro AS id_encuentro,
                        est.id_estadio AS id_estadio,
                        ex.fecha::DATE AS fecha,
                        ex.fecha::TIME AS hora,
                        est.nombre AS estadio,
                        local.id_equipo AS id_equipo_local,
                        local.pais AS equipo_local,
                        visitante.id_equipo AS id_equipo_visitante,
                        visitante.pais AS equipo_visitante,
                        MIN(h.precio) AS precio_minimo,
                        MAX(h.precio) AS precio_maximo,
                        c.capacidad_total - COALESCE(v.entradas_vendidas, 0) AS cupos_disponibles
                    FROM encuentro ex
                    JOIN habilita h
                        ON ex.id_encuentro = h.fk_encuentro
                    JOIN estadio est
                        ON ex.fk_estadio = est.id_estadio
                    JOIN equipo local
                        ON ex.fk_equipo_local = local.id_equipo
                    JOIN equipo visitante
                        ON ex.fk_equipo_visitante = visitante.id_equipo
                    JOIN capacidad c
                        ON c.fk_encuentro = ex.id_encuentro
                    LEFT JOIN ventas v
                        ON v.fk_encuentro = ex.id_encuentro
                    WHERE ex.estado = 'programado'{whereExtras}
                    GROUP BY
                        ex.id_encuentro,
                        est.id_estadio,
                        ex.fecha,
                        est.nombre,
                        local.id_equipo,
                        local.pais,
                        visitante.id_equipo,
                        visitante.pais,
                        c.capacidad_total,
                        v.entradas_vendidas
                    ORDER BY ex.fecha;", connection);

            if (equipoId.HasValue)
                command.Parameters.AddWithValue("equipoId", equipoId.Value);
                // Agrega el parámetro del equipo si se proporcionó
            if (estadioId.HasValue)
                command.Parameters.AddWithValue("estadioId", estadioId.Value);
                // Agrega el parámetro del estadio si se proporcionó

            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                menuMatches.Add(MapMatchDto(reader));
            }

            return menuMatches;
        }
        catch (Npgsql.NpgsqlException ex)
        {
            // Si hay un error específico de la base de datos, lo registramos y devolvemos una lista vacía.
            Console.Error.WriteLine($"MenuMatchDtoRepository DB error: {ex.Message}");
            return menuMatches;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"MenuMatchDtoRepository error: {ex.Message}");
            return menuMatches;
        }
    }

    // Mapea un registro del resultado de la consulta a un EncuentroMenuDto
    private static EncuentroMenuDto MapMatchDto(NpgsqlDataReader reader)
    {
        var ordEncuentro = reader.GetOrdinal("id_encuentro");
        var ordIdEstadio = reader.GetOrdinal("id_estadio");
        var ordStadium = reader.GetOrdinal("estadio");
        var ordIdLocal = reader.GetOrdinal("id_equipo_local");
        var ordLocal = reader.GetOrdinal("equipo_local");
        var ordIdVisitor = reader.GetOrdinal("id_equipo_visitante");
        var ordVisitor = reader.GetOrdinal("equipo_visitante");
        var ordHora = reader.GetOrdinal("hora");
        var ordFecha = reader.GetOrdinal("fecha");
        var ordMinPrice = reader.GetOrdinal("precio_minimo");
        var ordMaxPrice = reader.GetOrdinal("precio_maximo");
        var ordCupos = reader.GetOrdinal("cupos_disponibles");

        return new EncuentroMenuDto
        {
            IdEncuentro = reader.GetInt32(ordEncuentro),
            IdEstadio = reader.GetInt32(ordIdEstadio),
            Estadio = reader.GetString(ordStadium),
            IdEquipoLocal = reader.GetInt32(ordIdLocal),
            EquipoLocal = reader.GetString(ordLocal),
            IdEquipoVisitante = reader.GetInt32(ordIdVisitor),
            EquipoVisitante = reader.GetString(ordVisitor),
            Hora = reader.IsDBNull(ordHora) ? default : reader.GetFieldValue<TimeOnly>(ordHora),
            Fecha = reader.IsDBNull(ordFecha) ? default : reader.GetFieldValue<DateOnly>(ordFecha),
            PrecioMinimo = reader.GetDouble(ordMinPrice),
            PrecioMaximo = reader.GetDouble(ordMaxPrice),
            EntradasDisponibles = reader.GetInt32(ordCupos),
        };
    }
}
