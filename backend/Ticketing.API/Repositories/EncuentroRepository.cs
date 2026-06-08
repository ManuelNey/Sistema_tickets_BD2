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
}
