using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class EstadisticasRepository : IEstadisticasRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public EstadisticasRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyCollection<TopEncuentrosMasVendidosDto>> GetAllAsync()
    {
        var encuentros = new List<TopEncuentrosMasVendidosDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT
                COUNT(e.fk_compra_id) AS cantidad_entradas_vendidas,
                enc.id_encuentro,
                ql.nombre AS equipo_local,
                qv.nombre AS equipo_visitante,
                est.nombre as nombre_estadio,
                enc.fecha
            FROM entrada e
            JOIN habilita h ON e.fk_habilita_id = h.id
            JOIN encuentro enc ON h.fk_encuentro = enc.id_encuentro
            JOIN equipo ql ON enc.fk_equipo_local = ql.id_equipo
            JOIN equipo qv ON enc.fk_equipo_visitante = qv.id_equipo
            JOIN estadio est on enc.fk_estadio = est.id_estadio
            WHERE e.estado='activa' OR e.estado='utilizada' OR e.estado='transferida'
            GROUP BY
                enc.id_encuentro,
                ql.nombre,
                qv.nombre,
                est.nombre,
                enc.fecha
            ORDER BY cantidad_entradas_vendidas DESC
            LIMIT 5;", connection);

        await using var reader = await command.ExecuteReaderAsync();


        while (await reader.ReadAsync())
        {
            encuentros.Add(new TopEncuentrosMasVendidosDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
                EntradasVendidas = reader.GetInt32(reader.GetOrdinal("cantidad_entradas_vendidas")),
                EquipoLocal = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                NombreEstadio = reader.GetString(reader.GetOrdinal("nombre_estadio")),
                Fecha = reader.GetDateTime(reader.GetOrdinal("fecha"))
            });
        }

        return encuentros;
    }

    
}
