using Npgsql;
using Ticketing.API.Data;

namespace Ticketing.API.Services;

// Servicio encargado exclusivamente de actualizar estados de transferencias.
public class ActualizarEstadosTransferenciasService
{
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<ActualizarEstadosTransferenciasService> _logger;

    // Recibe la fabrica de conexiones a PostgreSQL y el logger.
    public ActualizarEstadosTransferenciasService(
        IPostgresConnectionFactory connectionFactory,
        ILogger<ActualizarEstadosTransferenciasService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    // Rechaza automaticamente transferencias pendientes vencidas y reactiva sus entradas.
    public async Task ActualizarAsync(CancellationToken stoppingToken = default)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(stoppingToken);

        await using var transaction = await connection.BeginTransactionAsync(stoppingToken);

        try
        {
            var entradasAReactivar = new List<int>();

            //Paso las transferencias pendientes a rechazadas
            await using var command1 = new NpgsqlCommand(
                @"UPDATE transferencia
                SET estado = 'rechazada'
                WHERE estado = 'pendiente'
                AND fecha <= NOW() - INTERVAL '1 day'
                RETURNING fk_entrada_id;",
                connection,
                transaction);

            // Como devuelvo los id de las entradas, los agrego a una lista
            await using (var reader = await command1.ExecuteReaderAsync(stoppingToken))
            {
                while (await reader.ReadAsync(stoppingToken))
                {
                    entradasAReactivar.Add(reader.GetInt32(0));
                }
            }

            //En base a los ids de las entradas, las reactivo
            if (entradasAReactivar.Count > 0)
            {
                await using var command2 = new NpgsqlCommand(
                    @"UPDATE entrada
                    SET estado = 'activa'
                    WHERE estado = 'transferida'
                    AND id_entrada = ANY(@entradasIds);",
                    connection,
                    transaction);

                command2.Parameters.AddWithValue("@entradasIds", entradasAReactivar.ToArray());

                await command2.ExecuteNonQueryAsync(stoppingToken);
            }

            await transaction.CommitAsync(stoppingToken);

            //cantidad de transferencias que se cambiaron el estado automaticamente 
            //se muestra en consola
            if (entradasAReactivar.Count > 0)
            {
                _logger.LogInformation(
                    "Transferencias pendientes rechazadas por vencimiento: {Cantidad}",
                    entradasAReactivar.Count
                );
            }
        }
        catch
        {
            await transaction.RollbackAsync(stoppingToken);
            throw;
        }
    }
}
