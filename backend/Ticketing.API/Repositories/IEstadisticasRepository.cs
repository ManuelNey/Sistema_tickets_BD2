using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IEstadisticasRepository
{
    Task<IReadOnlyCollection<TopEncuentrosMasVendidosDto>> GetAllAsync(DateTime? desde, DateTime? hasta);
    Task<IReadOnlyCollection<TopUsuariosMasEntradasCompradasDto>> GetAllUsers(DateTime? desde, DateTime? hasta);
    Task<PorcentajeCanceladasDto> GetPorcentajeCanceladas(DateTime? desde, DateTime? hasta);
    Task<IReadOnlyCollection<EstadioEntradasDto>> GetEstadioEntradas(DateTime? desde, DateTime? hasta);
    Task<IReadOnlyCollection<TopUsuariosTransferenciaDto>> GetUsuariosTransferencias(DateTime? desde, DateTime? hasta);
}
