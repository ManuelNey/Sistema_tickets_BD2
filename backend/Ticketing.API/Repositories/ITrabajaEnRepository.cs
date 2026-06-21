using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ITrabajaEnRepository
{
    Task<IReadOnlyCollection<TrabajaEnDto>> GetByEncuentroAsync(int encuentroId);
    Task<bool> CreateAsync(CrearTrabajaEnDto asignacion);
    Task<bool> DeleteAsync(string funcionarioMail, int habilitaId);
}