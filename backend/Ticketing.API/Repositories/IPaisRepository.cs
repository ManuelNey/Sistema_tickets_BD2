using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IPaisRepository
{
    Task<IReadOnlyCollection<PaisDto>> GetPaises();
    
}
