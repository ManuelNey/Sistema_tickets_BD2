using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class TrabajaEnRepository : ITrabajaEnRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public TrabajaEnRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public Task<IReadOnlyCollection<TrabajaEnDto>> GetByEncuentroAsync(int encuentroId)
    {
        IReadOnlyCollection<TrabajaEnDto> asignaciones = new List<TrabajaEnDto>();
        return Task.FromResult(asignaciones);
    }

    public Task<bool> CreateAsync(CrearTrabajaEnDto asignacion)
    {
        return Task.FromResult(false);
    }

    public Task<bool> DeleteAsync(string funcionarioMail, int habilitaId)
    {
        return Task.FromResult(false);
    }
}