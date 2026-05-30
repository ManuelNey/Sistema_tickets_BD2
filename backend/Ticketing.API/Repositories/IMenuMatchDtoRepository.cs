using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IMenuMatchDtoRepository
{
    Task<IReadOnlyCollection<MenuMatchDto>> GetMenuMatchesAsync();
}