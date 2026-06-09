using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IEncuentroRepository
{
    Task<IReadOnlyCollection<SectorDisponibleDto>> GetSectoresByEncuentroAsync(int idEncuentro);
    Task<IReadOnlyCollection<EncuentroDto>> GetAllEncuentros();
}
