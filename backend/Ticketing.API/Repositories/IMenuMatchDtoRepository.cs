using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IMenuMatchDtoRepository
{
    Task<IReadOnlyCollection<EncuentroMenuDto>> GetMenuMatchesAsync(int? equipoId = null, int? estadioId = null);
}