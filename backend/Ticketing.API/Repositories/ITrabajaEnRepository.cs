using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ITrabajaEnRepository
{
    Task<IReadOnlyCollection<TrabajaEnDto>> GetByEncuentroAsync(int encuentroId);
    Task<bool> CreateAsync(CrearTrabajaEnDto asignacion, int paisSedeId);

    Task<bool> DeleteAsync(string funcionarioMail, int habilitaId, int paisSedeId);
}