using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IEntradaRepository
{
    Task<IReadOnlyCollection<ComprarEntradaResponse>> GetAllAsync();
    Task<DisponibilidadDto?> GetDisponibilidadAsync(int idHabilita);
    Task<ComprarEntradaResponse> CreateAsync(int idHabilita, int cantidad, string mail);
    Task<ObtenerEntradaDto?> ObtenerEntradaDto(int idEntrada);
    Task<IReadOnlyCollection<EntradaCodigoQrDto>>ObtenerEntradasQr(string mail);
    

    // hay que hacer un DTO específico para actualizar la entrada.
    //Task<ComprarEntradaRequest> UpdateAsync(int id,  entrada);
}
