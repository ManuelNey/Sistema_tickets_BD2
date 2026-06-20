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

    public async Task<IReadOnlyCollection<TopUsuariosMasEntradasCompradasDto>> GetAllUsers()
    {
        var usuarios = new List<TopUsuariosMasEntradasCompradasDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT
                c.fk_usuario_mail as mail,
                COUNT(e.id_entrada) AS cantidad_entradas
            FROM compra c
            JOIN entrada e ON e.fk_compra_id = c.id_compra
            WHERE c.estado = 'pagada'
            GROUP BY c.fk_usuario_mail
            ORDER BY cantidad_entradas DESC
            LIMIT 5;", connection);

        await using var reader = await command.ExecuteReaderAsync();


        while (await reader.ReadAsync())
        {
            usuarios.Add(new TopUsuariosMasEntradasCompradasDto
            {
                Cantidad = reader.GetInt32(reader.GetOrdinal("cantidad_entradas")),
                Mail = reader.GetString(reader.GetOrdinal("mail")),
            });
        }

        return usuarios;
    }

    public async Task<PorcentajeCanceladasDto> GetPorcentajeCanceladas()
    {
        int canceladas= -1;
        int totales = -1;

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT count(id_compra) as canceladas
            FROM compra
            WHERE  estado='cancelada';", connection);

        await using var reader = await command.ExecuteReaderAsync();

        await reader.ReadAsync();

        canceladas = reader.GetInt32(reader.GetOrdinal("canceladas"));
        

        await using var connection2 = _connectionFactory.CreateConnection();
        await connection2.OpenAsync();

        await using var command2 = new NpgsqlCommand(
            @"SELECT count(id_compra) as total
            FROM compra;", connection2);

        await using var reader2 = await command2.ExecuteReaderAsync();

        await reader2.ReadAsync();

        totales = reader2.GetInt32(reader2.GetOrdinal("total"));
        
        if (canceladas==-1 || totales == -1)
        {
            return null;
        }

        if (totales == 0)
        {
            return new PorcentajeCanceladasDto { Porcentaje = 0 };
        }

        return new PorcentajeCanceladasDto
        {
            Porcentaje = ((float)canceladas / totales) * 100
        };
    }

    public async Task<IReadOnlyCollection<EstadioEntradasDto>> GetEstadioEntradas()
    {
        var estadios = new List<EstadioEntradasDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT count(e.id_entrada) as cantidad, est.nombre
            FROM compra c JOIN usuario u on c.fk_usuario_mail = u.persona_mail
            JOIN entrada e on c.id_compra = e.fk_compra_id
            JOIN habilita h on e.fk_habilita_id = h.id
            JOIN sector s on h.fk_sector = s.id_sector
            JOIN estadio est on s.fk_estadio = est.id_estadio
            WHERE c.estado='pagada'
            GROUP BY est.nombre;", connection);

        await using var reader = await command.ExecuteReaderAsync();


        while (await reader.ReadAsync())
        {
            estadios.Add(new EstadioEntradasDto
            {
                CantidadEntradas = reader.GetInt32(reader.GetOrdinal("cantidad")),
                NombreEstadio = reader.GetString(reader.GetOrdinal("nombre")),
            });
        }

        return estadios;
    }
    
}
