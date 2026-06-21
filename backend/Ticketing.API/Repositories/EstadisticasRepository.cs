using Npgsql;
using NpgsqlTypes;
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

    public async Task<IReadOnlyCollection<TopEncuentrosMasVendidosDto>> GetAllAsync(DateTime? desde, DateTime? hasta)
    {
        var encuentros = new List<TopEncuentrosMasVendidosDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT
                COUNT(e.id_entrada) AS cantidad_entradas_vendidas,
                enc.id_encuentro,
                ql.nombre AS equipo_local,
                qv.nombre AS equipo_visitante,
                est.nombre as nombre_estadio,
                enc.fecha
            FROM entrada e
            JOIN compra c ON e.fk_compra_id = c.id_compra
            JOIN habilita h ON e.fk_habilita_id = h.id
            JOIN encuentro enc ON h.fk_encuentro = enc.id_encuentro
            JOIN equipo ql ON enc.fk_equipo_local = ql.id_equipo
            JOIN equipo qv ON enc.fk_equipo_visitante = qv.id_equipo
            JOIN estadio est on enc.fk_estadio = est.id_estadio
            WHERE e.estado IN ('activa', 'utilizada', 'transferida')
            AND (@desde IS NULL OR c.fecha >= @desde)
            AND (@hasta IS NULL OR c.fecha < @hasta)
            GROUP BY
                enc.id_encuentro,
                ql.nombre,
                qv.nombre,
                est.nombre,
                enc.fecha
            ORDER BY cantidad_entradas_vendidas DESC
            LIMIT 5;", connection);

        AddDateRangeParameters(command, desde, hasta);

        await using var reader = await command.ExecuteReaderAsync();


        while (await reader.ReadAsync())
        {
            encuentros.Add(new TopEncuentrosMasVendidosDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_encuentro")),
                EntradasVendidas = Convert.ToInt32(reader.GetInt64(reader.GetOrdinal("cantidad_entradas_vendidas"))),
                EquipoLocal = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                NombreEstadio = reader.GetString(reader.GetOrdinal("nombre_estadio")),
                Fecha = reader.GetDateTime(reader.GetOrdinal("fecha"))
            });
        }

        return encuentros;
    }

    public async Task<IReadOnlyCollection<TopUsuariosMasEntradasCompradasDto>> GetAllUsers(DateTime? desde, DateTime? hasta)
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
            AND (@desde IS NULL OR c.fecha >= @desde)
            AND (@hasta IS NULL OR c.fecha < @hasta)
            GROUP BY c.fk_usuario_mail
            ORDER BY cantidad_entradas DESC
            LIMIT 5;", connection);

        AddDateRangeParameters(command, desde, hasta);

        await using var reader = await command.ExecuteReaderAsync();


        while (await reader.ReadAsync())
        {
            usuarios.Add(new TopUsuariosMasEntradasCompradasDto
            {
                Cantidad = Convert.ToInt32(reader.GetInt64(reader.GetOrdinal("cantidad_entradas"))),
                Mail = reader.GetString(reader.GetOrdinal("mail")),
            });
        }

        return usuarios;
    }

    public async Task<PorcentajeCanceladasDto> GetPorcentajeCanceladas(DateTime? desde, DateTime? hasta)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT
                COUNT(*) FILTER (WHERE estado = 'cancelada') AS canceladas,
                COUNT(*) AS total
            FROM compra
            WHERE (@desde IS NULL OR fecha >= @desde)
            AND (@hasta IS NULL OR fecha < @hasta);", connection);

        AddDateRangeParameters(command, desde, hasta);

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return new PorcentajeCanceladasDto { Porcentaje = 0 };
        }

        var canceladas = Convert.ToInt32(reader.GetInt64(reader.GetOrdinal("canceladas")));
        var totales = Convert.ToInt32(reader.GetInt64(reader.GetOrdinal("total")));

        if (totales == 0)
        {
            return new PorcentajeCanceladasDto { Porcentaje = 0 };
        }

        return new PorcentajeCanceladasDto
        {
            Porcentaje = ((float)canceladas / totales) * 100
        };
    }

    public async Task<IReadOnlyCollection<EstadioEntradasDto>> GetEstadioEntradas(DateTime? desde, DateTime? hasta)
    {
        var estadios = new List<EstadioEntradasDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT count(e.id_entrada) as cantidad, est.nombre
            FROM compra c
            JOIN entrada e on c.id_compra = e.fk_compra_id
            JOIN habilita h on e.fk_habilita_id = h.id
            JOIN sector s on h.fk_sector = s.id_sector
            JOIN estadio est on s.fk_estadio = est.id_estadio
            WHERE c.estado='pagada'
            AND (@desde IS NULL OR c.fecha >= @desde)
            AND (@hasta IS NULL OR c.fecha < @hasta)
            GROUP BY est.nombre;", connection);

        AddDateRangeParameters(command, desde, hasta);

        await using var reader = await command.ExecuteReaderAsync();


        while (await reader.ReadAsync())
        {
            estadios.Add(new EstadioEntradasDto
            {
                CantidadEntradas = Convert.ToInt32(reader.GetInt64(reader.GetOrdinal("cantidad"))),
                NombreEstadio = reader.GetString(reader.GetOrdinal("nombre")),
            });
        }

        return estadios;
    }

    public async Task<IReadOnlyCollection<TopUsuariosTransferenciaDto>> GetUsuariosTransferencias(DateTime? desde, DateTime? hasta)
    {
        var usuarios = new List<TopUsuariosTransferenciaDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT COUNT(fk_usuario_mail_emisor) as cantidad, fk_usuario_mail_emisor as mail
            FROM transferencia
            WHERE (@desde IS NULL OR fecha >= @desde)
            AND (@hasta IS NULL OR fecha < @hasta)
            GROUP BY fk_usuario_mail_emisor
            ORDER BY cantidad DESC
            LIMIT 5;", connection);

        AddDateRangeParameters(command, desde, hasta);

        await using var reader = await command.ExecuteReaderAsync();


        while (await reader.ReadAsync())
        {
            usuarios.Add(new TopUsuariosTransferenciaDto
            {
                Cantidad = Convert.ToInt32(reader.GetInt64(reader.GetOrdinal("cantidad"))),
                Mail = reader.GetString(reader.GetOrdinal("mail")),
            });
        }

        return usuarios;
    }

    private static void AddDateRangeParameters(NpgsqlCommand command, DateTime? desde, DateTime? hasta)
    {
        command.Parameters.Add("@desde", NpgsqlDbType.Timestamp).Value = desde ?? (object)DBNull.Value;
        command.Parameters.Add("@hasta", NpgsqlDbType.Timestamp).Value = hasta ?? (object)DBNull.Value;
    }
    
}
