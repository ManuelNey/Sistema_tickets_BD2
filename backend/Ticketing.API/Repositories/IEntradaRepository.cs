using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IEntradaRepository
{
    Task<DisponibilidadDto?> GetDisponibilidadAsync(int idHabilita);
    Task<ObtenerEntradaDto?> ObtenerEntradaDto(int idEntrada, string mail);
    Task<IReadOnlyCollection<EntradaCodigoQrDto>>ObtenerEntradasQr(string mail);
    Task<bool> MarcarEntradaComoUtilizadaAsync(int entradaId, string mailUsuario, string? mailFuncionario);
    
}
