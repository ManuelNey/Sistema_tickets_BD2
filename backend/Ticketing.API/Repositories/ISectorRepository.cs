using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ISectorRepository
{
    Task<IReadOnlyCollection<SectorDto>> GetAllAsync(int id);
    Task<SectorDto> CreateAsync(CrearSectorDto sector);
    Task<SectorDto> UpdateAsync(int id, ActualizarSectorDto sector);
    Task<bool> DeleteAsync(int id);
}
