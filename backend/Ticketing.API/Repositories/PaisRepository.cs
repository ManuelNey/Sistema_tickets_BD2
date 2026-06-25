using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class PaisRepository : IPaisRepository
{
     private readonly IPostgresConnectionFactory _connectionFactory;

    public PaisRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene la lista de países disponibles en el sistema
    public async Task<IReadOnlyCollection<PaisDto>> GetPaises()
    {
        var paises = new List<PaisDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        // Obtenemos id y pais de la tabla equipo, que representa a los paises participantes del mundial.
        await using var cmd = new NpgsqlCommand(@"
            SELECT id_equipo, pais
            from equipo;
            ", connection);

        await using var reader = await cmd.ExecuteReaderAsync();

        //Formateamos cada fila de la consulta a un DTO para devolverlo a la API como tal
        while (await reader.ReadAsync())
        {
            paises.Add(new PaisDto
            {
            Id = reader.GetInt32(reader.GetOrdinal("id_equipo")),
            Nombre = reader.GetString(reader.GetOrdinal("pais"))
            });
        }

        return paises;
    }
}