namespace Ticketing.API.Services;
// Servicio coordinador de actualizaciones de estado.
// Centraliza la ejecución de las actualizaciones sin mezclar la lógica específica.
public class ActualizarEstadosService
{
    private readonly ActualizarEstadosEncuentrosService _encuentrosService;
    private readonly ActualizarEstadosComprasService _comprasService;

    // Recibe los servicios específicos encargados de actualizar cada entidad.
    public ActualizarEstadosService(
        ActualizarEstadosEncuentrosService encuentrosService,
        ActualizarEstadosComprasService comprasService)
    {
        _encuentrosService = encuentrosService;
        _comprasService = comprasService;
    }

    // Ejecuta las actualizaciones de estados del sistema.
    public async Task EjecutarAsync(CancellationToken stoppingToken = default)
    {
        // Actualiza estados de encuentros.
        await _encuentrosService.ActualizarAsync(stoppingToken);
        // Actualiza estados de compras pendientes vencidas.
        await _comprasService.ActualizarAsync(stoppingToken);
    }
}