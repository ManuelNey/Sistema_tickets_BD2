using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class SectorRepository : ISectorRepository
{
     private readonly IPostgresConnectionFactory _connectionFactory;

    public SectorRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

   public async Task<IReadOnlyCollection<SectorDto>> GetAllAsync(int id)
    {
        var sectores = new List<SectorDto>();

        // La factory arma una conexion usando el connection string de appsettings/docker.
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Esta consulta trae los estadios existentes en la tabla estadio.
        await using var command = new NpgsqlCommand(
        @"SELECT id_sector, nombre, capacidad_maxima, fk_estadio
        FROM sector
        WHERE fk_estadio = @idEstadio;", connection);

        command.Parameters.AddWithValue("@idEstadio", id);

        await using var reader = await command.ExecuteReaderAsync();

        // Cada fila de la base se transforma en un EstadioDto para devolverlo como JSON.
        while (await reader.ReadAsync())
        {
            sectores.Add(new SectorDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_sector")),
                Nombre = reader.GetString(reader.GetOrdinal("nombre")),
                Capacidad = reader.GetInt32(reader.GetOrdinal("capacidad_maxima")),
                Estadio = reader.GetInt32(reader.GetOrdinal("fk_estadio"))
            });
        }

        return sectores;
    }

    public async Task<SectorDto?> CreateAsync(CrearSectorDto sector, int paisSedeId)
    {
        //No se pueden agregar más de 4 sectores por estadio, ni agregar sectores a estadios que no sean de su país sede.


        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"INSERT INTO sector(nombre, capacidad_maxima, fk_estadio)
            SELECT @nombre, @capacidad, @idEstadio
            WHERE EXISTS (
                SELECT 1
                FROM estadio
                WHERE id_estadio = @idEstadio
                AND fk_pais_sede = @paisSedeId
            )
            AND (
                SELECT COUNT(*) FROM sector WHERE fk_estadio = @idEstadio
            ) < 4
            RETURNING id_sector, nombre, capacidad_maxima, fk_estadio;", connection);

        command.Parameters.AddWithValue("@nombre", sector.Nombre);
        command.Parameters.AddWithValue("@capacidad", sector.Capacidad);
        command.Parameters.AddWithValue("@idEstadio", sector.Estadio);
        command.Parameters.AddWithValue("@paisSedeId", paisSedeId);
    
    await using var reader = await command.ExecuteReaderAsync();


    if(!await reader.ReadAsync())
    {
        return null;
    }

    return new SectorDto
    {
        Id= reader.GetInt32(reader.GetOrdinal("id_sector")),
        Nombre= reader.GetString(reader.GetOrdinal("nombre")),
        Capacidad= reader.GetInt32(reader.GetOrdinal("capacidad_maxima")),
        Estadio= reader.GetInt32(reader.GetOrdinal("fk_estadio"))
    };
    }

    public async Task<SectorDto?> UpdateAsync(int id, ActualizarSectorDto sector, int paisSedeId)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            @"UPDATE sector AS s
                SET nombre = @nuevoNombre, capacidad_maxima = @nuevaCapacidad
                FROM estadio AS e
                WHERE s.id_sector = @idSector
                AND s.fk_estadio = e.id_estadio
                AND e.fk_pais_sede = @paisSedeId
                RETURNING s.id_sector, s.nombre, s.capacidad_maxima, s.fk_estadio;", connection);

        command.Parameters.AddWithValue("@idSector",id);
        command.Parameters.AddWithValue("@nuevoNombre",sector.Nombre);
        command.Parameters.AddWithValue("@nuevaCapacidad",sector.Capacidad);
        command.Parameters.AddWithValue("@paisSedeId", paisSedeId);

        await using var reader = await command.ExecuteReaderAsync();

        if(!await reader.ReadAsync())
        {
            return null;
        }

        return new SectorDto
            {
                Id= reader.GetInt32(reader.GetOrdinal("id_sector")),
                Nombre= reader.GetString(reader.GetOrdinal("nombre")),
                Capacidad= reader.GetInt32(reader.GetOrdinal("capacidad_maxima")),
                Estadio= reader.GetInt32(reader.GetOrdinal("fk_estadio"))
            };
    }

    public async Task<bool> DeleteAsync(int id, int paisSedeId)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"DELETE FROM sector AS s
            USING estadio AS e
            WHERE s.id_sector = @idSector
            AND s.fk_estadio = e.id_estadio
            AND e.fk_pais_sede = @paisSedeId;", connection);

        command.Parameters.AddWithValue("@idSector", id);
        command.Parameters.AddWithValue("@paisSedeId", paisSedeId);

        var affectedRows = await command.ExecuteNonQueryAsync();

        return affectedRows > 0;
    }
}
