using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ISectorRepository
{
    Task<IReadOnlyCollection<SectorDto>> GetAllAsync(int id);
    Task<SectorDto?> CreateAsync(CrearSectorDto sector, int paisSedeId);
    Task<SectorDto?> UpdateAsync(int id, ActualizarSectorDto sector, int paisSedeId);
    Task<bool> DeleteAsync(int id, int paisSedeId);
}
