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

    public async Task<int> ReservarAsync(List<ReservarEntradaRequest> items, string mail)
    {
        if (items == null || items.Count == 0)
            throw new InvalidOperationException("Debe incluir al menos un sector");

        int totalCantidad = 0;
        foreach (var item in items)
        {
            if (item.Cantidad <= 0)
                throw new InvalidOperationException("La cantidad debe ser mayor a 0");

            totalCantidad += item.Cantidad;
        } 
        if (totalCantidad > 5)
            throw new InvalidOperationException("No es válido pedir más de 5 entradas en total");

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        //Obtenemos la cantidad disponible y el precio por cada sector.
        var sectoresValidos = new List<(int IdHabilita, int Cantidad, decimal Precio)>();
        foreach (var item in items)
        {
            await using var cmdCheck = new NpgsqlCommand(@"
                SELECT s.capacidad_maxima - COUNT(e.id_entrada) AS disponibles, h.precio
                FROM habilita h
                JOIN sector s        ON h.fk_sector      = s.id_sector
                LEFT JOIN entrada e  ON e.fk_habilita_id = h.id
                WHERE h.id = @id_habilita
                GROUP BY s.capacidad_maxima, h.precio;", connection);
            cmdCheck.Parameters.AddWithValue("@id_habilita", item.IdHabilita);

            await using var rdr = await cmdCheck.ExecuteReaderAsync();
            if (!await rdr.ReadAsync())
                throw new KeyNotFoundException($"La habilitación {item.IdHabilita} no existe");

            var disponibles = rdr.GetInt32(rdr.GetOrdinal("disponibles"));
            var precio = rdr.GetDecimal(rdr.GetOrdinal("precio"));
            await rdr.CloseAsync();

            if (disponibles < item.Cantidad)
                throw new InvalidOperationException($"No hay cupos suficientes en el sector {item.IdHabilita}");

            sectoresValidos.Add((item.IdHabilita, item.Cantidad, precio));
        }

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

        //Precio final = suma(precio * cantidad por sector) * (1 + comision%).
        decimal subtotal = sectoresValidos.Sum(s => s.Precio * s.Cantidad);
        decimal montoTotal = subtotal * (1 + porcentajeComision / 100m);

        //Transaccion para insertar todo o nada.
        //Aunque aca se pudieron implementar triggers preferimos hacerlo con una trasferencia para probar métodos distintos.
        await using var transaction = await connection.BeginTransactionAsync();

        //Insertamos la compra y nos quedamos con el id
        await using var cmdCompra = new NpgsqlCommand(@"
            INSERT INTO compra (estado, monto_total, fk_comision, fk_usuario_mail)
            VALUES ('pendiente', @monto, @comision, @mail)
            RETURNING id_compra;", connection, transaction);
        cmdCompra.Parameters.AddWithValue("@monto", montoTotal);
        cmdCompra.Parameters.AddWithValue("@comision", (object?)idComision ?? DBNull.Value);
        cmdCompra.Parameters.AddWithValue("@mail", mail);

        var resultado = await cmdCompra.ExecuteScalarAsync();
        if (resultado == null)
            throw new Exception("No se pudo obtener el ID de la compra.");

        int idCompra = Convert.ToInt32(resultado);

        //Se inserta cada entrada por cada sector
        foreach (var sec in sectoresValidos)
        {
            for (int i = 0; i < sec.Cantidad; i++)
            {
                await using var cmdEntrada = new NpgsqlCommand(@"
                    INSERT INTO entrada (estado, fk_habilita_id, fk_compra_id, fk_usuario_mail)
                    VALUES ('reservada', @idHabilita, @idCompra, @mail);", connection, transaction);
                cmdEntrada.Parameters.AddWithValue("@idHabilita", sec.IdHabilita);
                cmdEntrada.Parameters.AddWithValue("@idCompra", idCompra);
                cmdEntrada.Parameters.AddWithValue("@mail", mail);
                await cmdEntrada.ExecuteNonQueryAsync();
            }
        }

        //cerramos la transaccion
        await transaction.CommitAsync();
        return idCompra;
    }

    // Detalle de una compra puntual. Devuelve null si no existe o no es del usuario.
    public async Task<CompraDetalleDto?> GetCompraDetalleAsync(int idCompra, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Primera query: datos de la compra (sin sector).
        await using var cmdCompra = new NpgsqlCommand(@"
            SELECT
                c.id_compra,
                c.estado,
                c.monto_total,
                c.fecha,
                el.nombre AS equipo_local,
                ev.nombre AS equipo_visitante,
                en.fecha  AS fecha_encuentro,
                es.nombre AS estadio
            FROM compra c
            JOIN entrada  e   ON e.fk_compra_id         = c.id_compra
            JOIN habilita h   ON e.fk_habilita_id       = h.id
            JOIN encuentro en ON h.fk_encuentro         = en.id_encuentro
            JOIN equipo   el  ON en.fk_equipo_local     = el.id_equipo
            JOIN equipo   ev  ON en.fk_equipo_visitante = ev.id_equipo
            JOIN estadio  es  ON en.fk_estadio          = es.id_estadio
            WHERE c.fk_usuario_mail = @mail AND c.id_compra = @idCompra
            GROUP BY c.id_compra, c.estado, c.monto_total, c.fecha,
                     el.nombre, ev.nombre, en.fecha, es.nombre;", connection);
        cmdCompra.Parameters.AddWithValue("@mail", mail);
        cmdCompra.Parameters.AddWithValue("@idCompra", idCompra);

        CompraDetalleDto? dto = null;
        await using (var reader = await cmdCompra.ExecuteReaderAsync())
        {
            if (!await reader.ReadAsync()) return null;
            var fechaEncuentro = reader.GetDateTime(reader.GetOrdinal("fecha_encuentro"));
            dto = new CompraDetalleDto
            {
                IdCompra = reader.GetInt32(reader.GetOrdinal("id_compra")),
                Estado = reader.GetString(reader.GetOrdinal("estado")),
                MontoTotal = reader.GetDecimal(reader.GetOrdinal("monto_total")),
                EquipoLocal = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                FechaEncuentro = DateOnly.FromDateTime(fechaEncuentro),
                HoraEncuentro = TimeOnly.FromDateTime(fechaEncuentro),
                Estadio = reader.GetString(reader.GetOrdinal("estadio")),
                FechaReserva = reader.GetDateTime(reader.GetOrdinal("fecha"))
            };
        }

        // Segunda query: sectores y cantidades de esa compra.
        await using var cmdSectores = new NpgsqlCommand(@"
            SELECT s.nombre AS sector, COUNT(e.id_entrada) AS cantidad
            FROM entrada e
            JOIN habilita h ON e.fk_habilita_id = h.id
            JOIN sector   s ON h.fk_sector       = s.id_sector
            WHERE e.fk_compra_id = @idCompra
            GROUP BY s.nombre;", connection);
        cmdSectores.Parameters.AddWithValue("@idCompra", idCompra);

        await using var readerSectores = await cmdSectores.ExecuteReaderAsync();
        while (await readerSectores.ReadAsync())
        {
            dto.Sectores.Add(new SectorCantidadDto
            {
                Sector = readerSectores.GetString(readerSectores.GetOrdinal("sector")),
                Cantidad = (int)readerSectores.GetInt64(readerSectores.GetOrdinal("cantidad"))
            });
        }

        return dto;
    }

    // Listado de las compras/reservas del usuario autenticado, de la más reciente a la más vieja.
    // Si llega un 'estado' (pendiente/pagada/cancelada) filtra solo ese estado; si llega null devuelve todas.
    public async Task<List<CompraDetalleDto>> GetMisReservasAsync(string mail, string? estado = null)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Primera query: una fila por compra, sin sector.
        await using var cmdCompras = new NpgsqlCommand(@"
            SELECT
                c.id_compra,
                c.estado,
                c.monto_total,
                c.fecha,
                el.nombre AS equipo_local,
                ev.nombre AS equipo_visitante,
                en.fecha  AS fecha_encuentro,
                es.nombre AS estadio
            FROM compra c
            JOIN entrada  e   ON e.fk_compra_id         = c.id_compra
            JOIN habilita h   ON e.fk_habilita_id       = h.id
            JOIN encuentro en ON h.fk_encuentro         = en.id_encuentro
            JOIN equipo   el  ON en.fk_equipo_local     = el.id_equipo
            JOIN equipo   ev  ON en.fk_equipo_visitante = ev.id_equipo
            JOIN estadio  es  ON en.fk_estadio          = es.id_estadio
            WHERE c.fk_usuario_mail = @mail
              AND c.estado = @estado
            GROUP BY c.id_compra, c.estado, c.monto_total, c.fecha,
                     el.nombre, ev.nombre, en.fecha, es.nombre
            ORDER BY c.fecha DESC;", connection);
        cmdCompras.Parameters.AddWithValue("@mail", mail);
        cmdCompras.Parameters.AddWithValue("@estado", (object?)estado ?? DBNull.Value);

        var reservas = new List<CompraDetalleDto>();
        await using (var reader = await cmdCompras.ExecuteReaderAsync())
        {
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
                    FechaReserva = reader.GetDateTime(reader.GetOrdinal("fecha")),
                });
            }
        }

        // Obtenemos de cada reserva los sectores y cantidades asociados.
        // Aspi los incorporamos a cada reserva. 
        foreach (var reserva in reservas)
        {
            await using var cmdSectores = new NpgsqlCommand(@"
                SELECT s.nombre AS sector, COUNT(e.id_entrada) AS cantidad
                FROM entrada e
                JOIN habilita h ON e.fk_habilita_id = h.id
                JOIN sector   s ON h.fk_sector       = s.id_sector
                WHERE e.fk_compra_id = @idCompra
                GROUP BY s.nombre;", connection);
            cmdSectores.Parameters.AddWithValue("@idCompra", reserva.IdCompra);

            await using var readerSectores = await cmdSectores.ExecuteReaderAsync();
            while (await readerSectores.ReadAsync())
            {
                reserva.Sectores.Add(new SectorCantidadDto
                {
                    Sector = readerSectores.GetString(readerSectores.GetOrdinal("sector")),
                    Cantidad = (int)readerSectores.GetInt64(readerSectores.GetOrdinal("cantidad"))
                });
            }
        }

        return reservas;
    }
}