using Npgsql;
using Ticketing.API.Data;

namespace Ticketing.API.Services;

// Servicio encargado exclusivamente de actualizar estados de compras.
public class ActualizarEstadosComprasService
{
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<ActualizarEstadosComprasService> _logger;

    // Recibe la fábrica de conexiones a PostgreSQL y el logger.
    public ActualizarEstadosComprasService(
        IPostgresConnectionFactory connectionFactory,
        ILogger<ActualizarEstadosComprasService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

     // Cancela automáticamente las compras pendientes que superaron el tiempo permitido.
    public async Task ActualizarAsync(CancellationToken stoppingToken = default)
    {
         // Crea y abre una conexión a la base de datos.
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(stoppingToken);

        // Cambia a 'cancelada' toda compra pendiente creada hace más de 15 minutos.
        await using var command = new NpgsqlCommand(
            @"UPDATE compra
            SET estado = 'cancelada'
            WHERE estado = 'pendiente'
            AND fecha <= (NOW() AT TIME ZONE 'America/Montevideo') - INTERVAL '15 minutes';",
            connection);

        var comprasCanceladas = await command.ExecuteNonQueryAsync(stoppingToken);

         // Registra en consola cuántas compras fueron canceladas automáticamente.
        if (comprasCanceladas > 0)
        {
            _logger.LogInformation(
                "Compras pendientes canceladas por vencimiento: {Cantidad}",
                comprasCanceladas
            );
        }
    }
}