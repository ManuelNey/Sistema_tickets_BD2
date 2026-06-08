using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

// El repositorio es la capa que habla directamente con PostgreSQL.
// El controller lo usa para no tener SQL dentro del endpoint.
public class EstadioRepository : IEstadioRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public EstadioRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyCollection<EstadioDto>> GetAllAsync()
    {
        var estadios = new List<EstadioDto>();

        // La factory arma una conexion usando el connection string de appsettings/docker.
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Esta consulta trae los estadios existentes en la tabla estadio.
        await using var command = new NpgsqlCommand(
            @"SELECT id_estadio, nombre, ciudad, fk_pais_sede
              FROM estadio
              ORDER BY nombre;", connection);

        await using var reader = await command.ExecuteReaderAsync();

        // Cada fila de la base se transforma en un EstadioDto para devolverlo como JSON.
        while (await reader.ReadAsync())
        {
            estadios.Add(new EstadioDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_estadio")),
                Nombre = reader.GetString(reader.GetOrdinal("nombre")),
                Ciudad = reader.GetString(reader.GetOrdinal("ciudad")),
                PaisSedeId = reader.GetInt32(reader.GetOrdinal("fk_pais_sede"))
            });
        }

        return estadios;
    }

    public async Task<EstadioDto> CreateAsync(CrearEstadioDto estadio)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            @"INSERT INTO estadio(nombre, ciudad, fk_pais_sede)
                VALUES (@nombre, @ciudad, @paisSedeId)
                RETURNING id_estadio, nombre, ciudad, fk_pais_sede;", connection);

    command.Parameters.AddWithValue("@nombre", estadio.Nombre);
    command.Parameters.AddWithValue("@ciudad", estadio.Ciudad);
    command.Parameters.AddWithValue("@paisSedeId", estadio.PaisSedeId);
    
    await using var reader = await command.ExecuteReaderAsync();

    if(!await reader.ReadAsync())
    {
        throw new InvalidOperationException("No se pudo crear el estadio.");
    }

    return new EstadioDto
    {
        Id= reader.GetInt32(reader.GetOrdinal("id_estadio")),
        Nombre= reader.GetString(reader.GetOrdinal("nombre")),
        Ciudad= reader.GetString(reader.GetOrdinal("ciudad")),
        PaisSedeId= reader.GetInt32(reader.GetOrdinal("fk_pais_sede"))
    };
    }

    public async Task<EstadioDto> UpdateAsync(int id, ActualizarEstadioDto estadio)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            @"UPDATE estadio
                SET nombre = @nuevoNombre, ciudad = @nuevaCiudad, fk_pais_sede = @nuevoPais
                WHERE id_estadio= @idEstadio
                RETURNING id_estadio, nombre, ciudad, fk_pais_sede;", connection);

        command.Parameters.AddWithValue("@nuevoNombre",estadio.Nombre);
        command.Parameters.AddWithValue("@nuevaCiudad",estadio.Ciudad);
        command.Parameters.AddWithValue("@nuevoPais",estadio.PaisSedeId);
        command.Parameters.AddWithValue("@idEstadio",id);


        await using var reader = await command.ExecuteReaderAsync();

        if(!await reader.ReadAsync())
        {
            return null;
        }

        return new EstadioDto
            {
                Id= reader.GetInt32(reader.GetOrdinal("id_estadio")),
                Nombre= reader.GetString(reader.GetOrdinal("nombre")),
                Ciudad= reader.GetString(reader.GetOrdinal("ciudad")),
                PaisSedeId= reader.GetInt32(reader.GetOrdinal("fk_pais_sede"))
            };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"DELETE FROM estadio
            WHERE id_estadio = @idEstadio;", connection);

        command.Parameters.AddWithValue("@idEstadio", id);

        var affectedRows = await command.ExecuteNonQueryAsync();

        return affectedRows > 0;
    }
    

    
}
