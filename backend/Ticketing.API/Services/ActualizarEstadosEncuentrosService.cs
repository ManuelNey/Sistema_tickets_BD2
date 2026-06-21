using Npgsql;
using Ticketing.API.Data;

namespace Ticketing.API.Services;

//BackgroungService es la clase que hace tareas en segundo plano
public class ActualizarEstadosEncuentrosService : BackgroundService
{
    //para la conexión de PostGreSql
    private readonly IPostgresConnectionFactory _connectionFactory;
    //Para escribir mensajes en consola cuando se actualice algo
    private readonly ILogger<ActualizarEstadosEncuentrosService> _logger;

    public ActualizarEstadosEncuentrosService(
        IPostgresConnectionFactory connectionFactory,
        ILogger<ActualizarEstadosEncuentrosService> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

//Este método se ejecuta de manera automática cuando se levanta la API
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            //Llama al método que actualiza los encuentros
            await ActualizarEstadosAsync(stoppingToken);
            //Espera un minuto antes de revisar de vuelta
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task ActualizarEstadosAsync(CancellationToken stoppingToken)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(stoppingToken);

        //Busca partidos en estado programado y que su fecha ya pasó
        await using var commandEnJuego = new NpgsqlCommand(
            @"UPDATE encuentro
            SET estado = 'en_juego'
            WHERE estado = 'programado'
            AND fecha <= NOW() AT TIME ZONE 'America/Montevideo';",
            connection);

        var pasadosAEnJuego = await commandEnJuego.ExecuteNonQueryAsync(stoppingToken);
        //Busca partidos que están en juego y que su fecha se pasó por 2 hora o más
        //para ponerlos en finalizados
        await using var commandFinalizados = new NpgsqlCommand(
            @"UPDATE encuentro
            SET estado = 'finalizado'
            WHERE estado = 'en_juego'
            AND fecha + INTERVAL '2 hours' <= NOW() AT TIME ZONE 'America/Montevideo';",
            connection);

        var pasadosAFinalizado = await commandFinalizados.ExecuteNonQueryAsync(stoppingToken);

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