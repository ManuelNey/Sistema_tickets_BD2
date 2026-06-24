namespace Ticketing.API.Services;

// Servicio en segundo plano que se ejecuta automáticamente al iniciar la API.
// Su responsabilidad es ejecutar periódicamente la actualización de estados.
public class ActualizarEstadosBackgroundService : BackgroundService
{
    private readonly ActualizarEstadosService _actualizarEstadosService;

    // Recibe el servicio coordinador que contiene las actualizaciones de estados.
    public ActualizarEstadosBackgroundService(ActualizarEstadosService actualizarEstadosService)
    {
        _actualizarEstadosService = actualizarEstadosService;
    }

    // Método principal del BackgroundService.
    // Se mantiene ejecutando mientras la API esté levantada.
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // Ejecuta todas las actualizaciones de estado configuradas.
            await _actualizarEstadosService.EjecutarAsync(stoppingToken);
            // Espera 1 minuto antes de volver a revisar.
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}