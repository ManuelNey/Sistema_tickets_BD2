using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IFuncionarioRepository
{
    Task<IReadOnlyCollection<FuncionarioDto>> GetAllAsync();
}
