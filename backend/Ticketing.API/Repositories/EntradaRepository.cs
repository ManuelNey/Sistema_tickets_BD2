using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class EntradaRepository : IEntradaRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public EntradaRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<DisponibilidadDto?> GetDisponibilidadAsync(int idHabilita)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT h.id, h.precio, s.capacidad_maxima,
                   COUNT(e.id_entrada)  AS entradas_vendidas,
                   eq_local.nombre      AS equipo_local,
                   eq_vis.nombre        AS equipo_visitante,
                   enc.fecha            AS fecha_encuentro,
                   est.nombre           AS nombre_estadio,
                   est.ciudad           AS ciudad_estadio,
                   s.nombre             AS nombre_sector
            FROM habilita h
            JOIN sector s          ON h.fk_sector             = s.id_sector
            JOIN encuentro enc     ON h.fk_encuentro          = enc.id_encuentro
            JOIN equipo eq_local   ON enc.fk_equipo_local     = eq_local.id_equipo
            JOIN equipo eq_vis     ON enc.fk_equipo_visitante  = eq_vis.id_equipo
            JOIN estadio est       ON enc.fk_estadio           = est.id_estadio
            LEFT JOIN entrada e    ON e.fk_habilita_id         = h.id
            WHERE h.id = @idHabilita
            GROUP BY h.id, h.precio, s.capacidad_maxima,
                     eq_local.nombre, eq_vis.nombre, enc.fecha,
                     est.nombre, est.ciudad, s.nombre", connection);

        cmd.Parameters.AddWithValue("@idHabilita", idHabilita);
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        var capacidad = reader.GetInt32(reader.GetOrdinal("capacidad_maxima"));
        var vendidas  = reader.GetInt32(reader.GetOrdinal("entradas_vendidas"));
        var fecha     = reader.GetDateTime(reader.GetOrdinal("fecha_encuentro"));

        return new DisponibilidadDto
        {
            IdHabilita      = idHabilita,
            EquipoLocal     = reader.GetString(reader.GetOrdinal("equipo_local")),
            EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
            FechaPartido    = DateOnly.FromDateTime(fecha),
            HoraPartido     = TimeOnly.FromDateTime(fecha),
            Estadio         = reader.GetString(reader.GetOrdinal("nombre_estadio")),
            Ciudad          = reader.GetString(reader.GetOrdinal("ciudad_estadio")),
            Sector          = reader.GetString(reader.GetOrdinal("nombre_sector")),
            Precio          = reader.GetDecimal(reader.GetOrdinal("precio")),
            Disponibles     = capacidad - vendidas
        };
    }

    public async Task<ComprarEntradaResponse> CreateAsync(int idHabilita, int cantidad, string mail)
    {
        if (cantidad < 1 || cantidad > 5)
            throw new ArgumentException("La cantidad debe estar entre 1 y 5");

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Verificar que la habilita existe y tiene cupo suficiente para la cantidad pedida,
        // y traer los datos del encuentro para armar el response.
        // Se usan bloques {} para cerrar cada reader antes de abrir el siguiente (Npgsql no soporta readers simultáneos).
        decimal precio;
        int idEncuentro, capacidadMaxima, entradasVendidas;
        string equipoLocal, equipoVisitante, nombreEstadio, ciudadEstadio, paisEstadio, nombreSector;
        DateTime fechaEncuentro;

        {
            await using var cmd = new NpgsqlCommand(@"
                SELECT h.precio, s.capacidad_maxima, h.fk_encuentro,
                       COUNT(e.id_entrada)  AS entradas_vendidas,
                       eq_local.nombre      AS equipo_local,
                       eq_vis.nombre        AS equipo_visitante,
                       enc.fecha            AS fecha_encuentro,
                       est.nombre           AS nombre_estadio,
                       est.ciudad           AS ciudad_estadio,
                       ps.nombre            AS pais_estadio,
                       s.nombre             AS nombre_sector
                FROM habilita h
                JOIN sector s          ON h.fk_sector             = s.id_sector
                JOIN encuentro enc     ON h.fk_encuentro          = enc.id_encuentro
                JOIN equipo eq_local   ON enc.fk_equipo_local     = eq_local.id_equipo
                JOIN equipo eq_vis     ON enc.fk_equipo_visitante  = eq_vis.id_equipo
                JOIN estadio est       ON enc.fk_estadio           = est.id_estadio
                JOIN pais_sede ps      ON est.fk_pais_sede         = ps.id_pais_sede
                LEFT JOIN entrada e    ON e.fk_habilita_id         = h.id
                WHERE h.id = @idHabilita
                GROUP BY h.precio, s.capacidad_maxima, h.fk_encuentro,
                         eq_local.nombre, eq_vis.nombre, enc.fecha,
                         est.nombre, est.ciudad, ps.nombre, s.nombre", connection);

            cmd.Parameters.AddWithValue("@idHabilita", idHabilita);
            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
                throw new Exception("Habilitación no encontrada");

            capacidadMaxima  = reader.GetInt32(reader.GetOrdinal("capacidad_maxima"));
            entradasVendidas = reader.GetInt32(reader.GetOrdinal("entradas_vendidas"));

            if (entradasVendidas + cantidad > capacidadMaxima)
                throw new Exception($"No hay suficientes cupos. Disponibles: {capacidadMaxima - entradasVendidas}");

            precio          = reader.GetDecimal(reader.GetOrdinal("precio"));
            idEncuentro     = reader.GetInt32(reader.GetOrdinal("fk_encuentro"));
            equipoLocal     = reader.GetString(reader.GetOrdinal("equipo_local"));
            equipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante"));
            fechaEncuentro  = reader.GetDateTime(reader.GetOrdinal("fecha_encuentro"));
            nombreEstadio   = reader.GetString(reader.GetOrdinal("nombre_estadio"));
            ciudadEstadio   = reader.GetString(reader.GetOrdinal("ciudad_estadio"));
            paisEstadio     = reader.GetString(reader.GetOrdinal("pais_estadio"));
            nombreSector    = reader.GetString(reader.GetOrdinal("nombre_sector"));
        }

        // Transacción: 1 INSERT compra → N INSERTs entrada (una por cada ticket pedido)
        await using var tx = await connection.BeginTransactionAsync();

        using var insertCompra = connection.CreateCommand();
        insertCompra.Transaction = tx;
        insertCompra.CommandText = @"
            INSERT INTO compra (fecha, estado, monto_total, fk_usuario_mail)
            VALUES (now(), 'confirmada', @montoTotal, @mail)
            RETURNING id_compra";
        insertCompra.Parameters.AddWithValue("@montoTotal", precio * cantidad);
        insertCompra.Parameters.AddWithValue("@mail", mail);

        var idCompra = (int)(await insertCompra.ExecuteScalarAsync())!;

        // Insertar una entrada por cada ticket de la compra
        var idsEntradas = new List<int>();
        for (var i = 0; i < cantidad; i++)
        {
            using var insertEntrada = connection.CreateCommand();
            insertEntrada.Transaction = tx;
            insertEntrada.CommandText = @"
                INSERT INTO entrada (estado, cantidad_transferencias, fk_habilita_id, fk_compra_id, fk_usuario_mail)
                VALUES ('activa', 0, @idHabilita, @idCompra, @mail)
                RETURNING id_entrada";
            insertEntrada.Parameters.AddWithValue("@idHabilita", idHabilita);
            insertEntrada.Parameters.AddWithValue("@idCompra", idCompra);
            insertEntrada.Parameters.AddWithValue("@mail", mail);

            idsEntradas.Add((int)(await insertEntrada.ExecuteScalarAsync())!);
        }

        await tx.CommitAsync();

        return new ComprarEntradaResponse
        {
            IdsEntradas                 = idsEntradas,
            EquipoLocal                 = equipoLocal,
            EquipoVisitante             = equipoVisitante,
            FechaPartido                = DateOnly.FromDateTime(fechaEncuentro),
            HoraPartido                 = TimeOnly.FromDateTime(fechaEncuentro),
            Estadio                     = nombreEstadio,
            CiudadEstadio               = ciudadEstadio,
            PaisEstadio                 = paisEstadio,
            Sector                      = nombreSector,
            PrecioUnitario              = precio,
            MontoTotal                  = precio * cantidad,
            CantidadEntradasCompradas   = entradasVendidas + cantidad,
            CantidadEntradasDisponibles = capacidadMaxima - (entradasVendidas + cantidad),
            FechaCompra                 = DateOnly.FromDateTime(DateTime.UtcNow)
        };
    }

    public Task<IReadOnlyCollection<ComprarEntradaResponse>> GetAllAsync()
    {
        throw new NotImplementedException();
    }
}
