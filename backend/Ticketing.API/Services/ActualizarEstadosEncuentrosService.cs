using Npgsql;
using Ticketing.API.Data;

namespace Ticketing.API.Services;

// Servicio encargado exclusivamente de actualizar estados de encuentros.
public class ActualizarEstadosEncuentrosService
{
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<ActualizarEstadosEncuentrosService> _logger;

    // Recibe la fábrica de conexiones a PostgreSQL y el logger.
    public ActualizarEstadosEncuentrosService(
        IPostgresConnectionFactory connectionFactory,
        ILogger<ActualizarEstadosEncuentrosService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    // Actualiza los encuentros según la fecha actual.
    public async Task ActualizarAsync(CancellationToken stoppingToken = default)
    {
        // Crea y abre una conexión a la base de datos.
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(stoppingToken);

         // Pasa a 'en_juego' los encuentros programados los cuales tiene la misma fecha que ahora
        await using var commandEnJuego = new NpgsqlCommand(
            @"UPDATE encuentro
            SET estado = 'en_juego'
            WHERE estado = 'programado'
            AND fecha <= NOW() AT TIME ZONE 'America/Montevideo';",
            connection);

        var pasadosAEnJuego = await commandEnJuego.ExecuteNonQueryAsync(stoppingToken);

        // Pasa a 'finalizado' los encuentros que llevan 2 horas o más en juego.
        await using var commandFinalizados = new NpgsqlCommand(
            @"UPDATE encuentro
            SET estado = 'finalizado'
            WHERE estado = 'en_juego'
            AND fecha + INTERVAL '2 hours' <= NOW() AT TIME ZONE 'America/Montevideo';",
            connection);

        var pasadosAFinalizado = await commandFinalizados.ExecuteNonQueryAsync(stoppingToken);

        // Registra en consola cuántos encuentros cambiaron de estado.
        if (pasadosAEnJuego > 0 || pasadosAFinalizado > 0)
        {
            _logger.LogInformation(
                "Estados de encuentros actualizados. En juego: {EnJuego}, Finalizados: {Finalizados}",
                pasadosAEnJuego,
                pasadosAFinalizado
            );
        }
    }
}