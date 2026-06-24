using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IValidacionRepository
{
    Task<ValidacionResumenDto> GetResumenAsync(int paisSedeId);
    Task<ValidacionesListaDto> GetValidacionesAsync(
        int paisSedeId,
        DateTime? desde,
        DateTime? hasta,
        int? estadioId,
        string? funcionarioMail,
        int numeroPagina,
        int cantidadPorPagina);
}
