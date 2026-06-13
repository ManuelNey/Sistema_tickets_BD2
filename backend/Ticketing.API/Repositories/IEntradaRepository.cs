using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IEntradaRepository
{
    Task<DisponibilidadDto?> GetDisponibilidadAsync(int idHabilita);
    Task<EntradaEstadoDto?> ObtenerEntrada(int idEntrada, string mail);
    Task<IReadOnlyCollection<EntradaCodigoQrDto>>ObtenerEntradasQr(string mail);
    Task<bool> MarcarEntradaComoUtilizadaAsync(int entradaId, string mailUsuario, string? mailFuncionario, string tokenUtilizado, string numeroDispositivo);
    
}
