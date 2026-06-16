using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class CompraRepository : ICompraRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public CompraRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }
    public async Task<bool> CancelarCompraAsync(int idCompra, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        //Verificamos existencia + propietario en una sola consulta (si no es tuya o no existe, no hay fila).
        //FOR UPDATE bloquea la fila durante la transaccion para evitar carreras.
        await using var cmdVerificar = new NpgsqlCommand(@"
            SELECT estado
            FROM compra
            WHERE id_compra = @idCompra AND fk_usuario_mail = @mail
            FOR UPDATE;", connection, transaction);
        cmdVerificar.Parameters.AddWithValue("@idCompra", idCompra);
        cmdVerificar.Parameters.AddWithValue("@mail", mail);

        await using (var reader = await cmdVerificar.ExecuteReaderAsync())
        {
            if (!await reader.ReadAsync())
                throw new KeyNotFoundException("La compra no existe");

            var estado = reader.GetString(reader.GetOrdinal("estado"));
            if (estado != "pendiente")
                throw new InvalidOperationException("Solo se pueden cancelar compras pendientes");
        }

        //Borramos las entradas 
        await using var cmdEntradas = new NpgsqlCommand(@"
            DELETE FROM entrada WHERE fk_compra_id = @idCompra;", connection, transaction);
        cmdEntradas.Parameters.AddWithValue("@idCompra", idCompra);

        await cmdEntradas.ExecuteNonQueryAsync();

        //Cancelamos la compra

        await using var cmdCompra = new NpgsqlCommand(@"
            UPDATE compra SET estado = 'cancelada' WHERE id_compra = @idCompra;", connection, transaction);
        cmdCompra.Parameters.AddWithValue("@idCompra", idCompra);
        await cmdCompra.ExecuteNonQueryAsync();

        await transaction.CommitAsync();
        return true;
    }

    public async Task<bool> ConfirmarCompraAsync(int idCompra, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        //Verificamos existencia + propietario (si no es tuya o no existe, no hay fila).
        //FOR UPDATE bloquea la fila durante la transaccion para evitar carreras.
        await using var cmdVerificar = new NpgsqlCommand(@"
            SELECT estado
            FROM compra
            WHERE id_compra = @idCompra AND fk_usuario_mail = @mail
            FOR UPDATE;", connection, transaction);
        cmdVerificar.Parameters.AddWithValue("@idCompra", idCompra);
        cmdVerificar.Parameters.AddWithValue("@mail", mail);

        await using (var reader = await cmdVerificar.ExecuteReaderAsync())
        {
            if (!await reader.ReadAsync())
                throw new KeyNotFoundException("La compra no existe");

            var estado = reader.GetString(reader.GetOrdinal("estado"));
            if (estado != "pendiente")
                throw new InvalidOperationException("La compra ya no está pendiente");
        }

        //La compra pasa a 'pagada'.
        await using var cmdCompra = new NpgsqlCommand(@"
            UPDATE compra SET estado = 'pagada' WHERE id_compra = @idCompra;", connection, transaction);
        cmdCompra.Parameters.AddWithValue("@idCompra", idCompra);
        await cmdCompra.ExecuteNonQueryAsync();

        //Sus entradas reservadas pasan a 'activa'.
        await using var cmdEntradas = new NpgsqlCommand(@"
            UPDATE entrada SET estado = 'activa'
            WHERE fk_compra_id = @idCompra AND estado = 'reservada';", connection, transaction);
        cmdEntradas.Parameters.AddWithValue("@idCompra", idCompra);
        await cmdEntradas.ExecuteNonQueryAsync();

        await transaction.CommitAsync();
        return true;
    }

    public async Task<int> ReservarAsync(ReservarEntradaRequest request, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        
        //Obtenemos la cantidad disponible de entradas, restando las entradas ya guardadas a la capacidad máxima del sector.

        await using var cmd = new NpgsqlCommand(@"
            SELECT s.capacidad_maxima - COUNT(e.id_entrada) AS disponibles, h.precio
            FROM habilita h
            JOIN sector s        ON h.fk_sector     = s.id_sector
            LEFT JOIN entrada e  ON e.fk_habilita_id = h.id
            WHERE h.id = @id_habilita
            GROUP BY s.capacidad_maxima, h.precio;", connection);

        cmd.Parameters.AddWithValue("@id_habilita", request.IdHabilita);
        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            throw new KeyNotFoundException("La habilitación no existe");
        }
        var cantDisponibles = reader.GetInt32(reader.GetOrdinal("disponibles"));
        var precioUnitario = reader.GetDecimal(reader.GetOrdinal("precio"));

        //Chequeo de entradas disponibles
        if (cantDisponibles < request.Cantidad)
        {
            throw new InvalidOperationException("No hay cupos suficientes");
        }

        //Chequeo de entradas disponibles
        if (5 < request.Cantidad)
        {
            throw new InvalidOperationException("No es válido pedir más de 5 entradas");
        }

        //Cerramos el reader antes de ejecutar comandos nuevos sobre la misma conexion.
        await reader.CloseAsync();

        //Buscamos la comisión vigente para calcular el monto total de la compra.
        //Si no hay ninguna vigente, la comisión es 0 y no hay comisión.
        int? idComision = null;
        decimal porcentajeComision = 0m;

        await using (var cmdComision = new NpgsqlCommand(@"
            SELECT id_comision, porcentaje
            FROM comision
            WHERE fecha_inicio <= CURRENT_DATE
              AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
            ORDER BY fecha_inicio DESC
            LIMIT 1;", connection))
        {
            await using var comReader = await cmdComision.ExecuteReaderAsync();
            if (await comReader.ReadAsync())
            {
                idComision = comReader.GetInt32(comReader.GetOrdinal("id_comision"));
                porcentajeComision = comReader.GetDecimal(comReader.GetOrdinal("porcentaje"));
            }
        }

        //Precio final = precio unitario * cantidad * (1 + comision%).
        decimal montoTotal = precioUnitario * request.Cantidad * (1 + porcentajeComision / 100m);

        //Transaccion para insertar ambos o ninguno.

        await using var transaction = await connection.BeginTransactionAsync();

        //Insertamos la compra y nos quedamos con el id
        await using var cmdCompra= new NpgsqlCommand(@"
            INSERT INTO compra (estado, monto_total, fk_comision, fk_usuario_mail)
            VALUES ('pendiente', @monto, @comision, @mail)
            RETURNING id_compra;", connection, transaction);

        cmdCompra.Parameters.AddWithValue("@monto", montoTotal);
        cmdCompra.Parameters.AddWithValue("@comision", (object?)idComision ?? DBNull.Value);
        cmdCompra.Parameters.AddWithValue("@mail", mail);

        object? resultado = await cmdCompra.ExecuteScalarAsync();

        if (resultado == null)
        {
            throw new Exception("No se pudo obtener el ID de la compra.");
        }

        int idCompra = Convert.ToInt32(resultado);
        
        //Se inserta cada entrada
        for (int i = 0; i < request.Cantidad; i++)
        {
            await using var cmdEntrada = new NpgsqlCommand(@"
                INSERT INTO entrada (estado, fk_habilita_id, fk_compra_id, fk_usuario_mail)
                VALUES ('reservada', @idHabilita, @idCompra, @mail);", connection, transaction);

            cmdEntrada.Parameters.AddWithValue("@idHabilita", request.IdHabilita);
            cmdEntrada.Parameters.AddWithValue("@idCompra", idCompra);
            cmdEntrada.Parameters.AddWithValue("@mail", mail);

            await cmdEntrada.ExecuteNonQueryAsync();
        }
        //cerramos la transaccion
        await transaction.CommitAsync();

        return idCompra;
    }

    // Detalle de una compra puntual. Devuelve null si no existe o no es del usuario.
    // Agrupamos por compra para que la cantidad sea el numero de entradas asociadas a dicha compra.
    public async Task<CompraDetalleDto?> GetCompraDetalleAsync(int idCompra, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT
                c.id_compra,
                c.estado,
                c.monto_total,
                c.fecha,
                el.nombre  AS equipo_local,
                ev.nombre  AS equipo_visitante,
                en.fecha   AS fecha_encuentro,
                es.nombre  AS estadio,
                s.nombre   AS sector,
                COUNT(e.id_entrada) AS cantidad
            FROM compra c
            JOIN entrada  e   ON e.fk_compra_id        = c.id_compra
            JOIN habilita h   ON e.fk_habilita_id      = h.id
            JOIN encuentro en ON h.fk_encuentro        = en.id_encuentro
            JOIN equipo   el  ON en.fk_equipo_local    = el.id_equipo
            JOIN equipo   ev  ON en.fk_equipo_visitante = ev.id_equipo
            JOIN estadio  es  ON en.fk_estadio         = es.id_estadio
            JOIN sector   s   ON h.fk_sector           = s.id_sector
            WHERE c.fk_usuario_mail = @mail AND c.id_compra = @idCompra
            GROUP BY c.id_compra, c.estado, c.monto_total, c.fecha,
                     el.nombre, ev.nombre, en.fecha, es.nombre, s.nombre;", connection);
        cmd.Parameters.AddWithValue("@mail", mail);
        cmd.Parameters.AddWithValue("@idCompra", idCompra);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return null;

        var fechaEncuentro = reader.GetDateTime(reader.GetOrdinal("fecha_encuentro"));

        return new CompraDetalleDto
        {
            IdCompra = reader.GetInt32(reader.GetOrdinal("id_compra")),
            Estado = reader.GetString(reader.GetOrdinal("estado")),
            MontoTotal = reader.GetDecimal(reader.GetOrdinal("monto_total")),
            EquipoLocal = reader.GetString(reader.GetOrdinal("equipo_local")),
            EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
            FechaEncuentro = DateOnly.FromDateTime(fechaEncuentro),
            HoraEncuentro = TimeOnly.FromDateTime(fechaEncuentro),
            Estadio = reader.GetString(reader.GetOrdinal("estadio")),
            Sector = reader.GetString(reader.GetOrdinal("sector")),
            Cantidad = (int)reader.GetInt64(reader.GetOrdinal("cantidad")),
            FechaReserva = reader.GetDateTime(reader.GetOrdinal("fecha"))
        };
    }

    // Listado de las compras/reservas del usuario autenticado, de la más reciente a la más vieja.
    // Agrupamos por compra para que la cantidad sea el numero de entradas asociadas a dicha compra.
    // Si llega un 'estado' (pendiente/pagada/cancelada) filtra solo ese estado; si llega null devuelve todas.
    public async Task<List<CompraDetalleDto>> GetMisReservasAsync(string mail, string? estado = null)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT
                c.id_compra,
                c.estado,
                c.monto_total,
                c.fecha,
                el.nombre  AS equipo_local,
                ev.nombre  AS equipo_visitante,
                en.fecha   AS fecha_encuentro,
                es.nombre  AS estadio,
                s.nombre   AS sector,
                COUNT(e.id_entrada) AS cantidad
            FROM compra c
            JOIN entrada  e   ON e.fk_compra_id        = c.id_compra
            JOIN habilita h   ON e.fk_habilita_id      = h.id
            JOIN encuentro en ON h.fk_encuentro        = en.id_encuentro
            JOIN equipo   el  ON en.fk_equipo_local    = el.id_equipo
            JOIN equipo   ev  ON en.fk_equipo_visitante = ev.id_equipo
            JOIN estadio  es  ON en.fk_estadio         = es.id_estadio
            JOIN sector   s   ON h.fk_sector           = s.id_sector
            WHERE c.fk_usuario_mail = @mail
              AND (@estado IS NULL OR c.estado = @estado)
            GROUP BY c.id_compra, c.estado, c.monto_total, c.fecha,
                     el.nombre, ev.nombre, en.fecha, es.nombre, s.nombre
            ORDER BY c.fecha DESC;", connection);
        cmd.Parameters.AddWithValue("@mail", mail);
        cmd.Parameters.AddWithValue("@estado", (object?)estado ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();

        var reservas = new List<CompraDetalleDto>();
        while (await reader.ReadAsync())
        {
            var fechaEncuentro = reader.GetDateTime(reader.GetOrdinal("fecha_encuentro"));
            reservas.Add(new CompraDetalleDto
            {
                IdCompra = reader.GetInt32(reader.GetOrdinal("id_compra")),
                Estado = reader.GetString(reader.GetOrdinal("estado")),
                MontoTotal = reader.GetDecimal(reader.GetOrdinal("monto_total")),
                EquipoLocal = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                FechaEncuentro = DateOnly.FromDateTime(fechaEncuentro),
                HoraEncuentro = TimeOnly.FromDateTime(fechaEncuentro),
                Estadio = reader.GetString(reader.GetOrdinal("estadio")),
                Sector = reader.GetString(reader.GetOrdinal("sector")),
                Cantidad = (int)reader.GetInt64(reader.GetOrdinal("cantidad")),
                FechaReserva = reader.GetDateTime(reader.GetOrdinal("fecha")),
            });
        }

        return reservas;
    }
}