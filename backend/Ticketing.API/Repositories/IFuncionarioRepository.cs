using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IFuncionarioRepository
{
    Task<IReadOnlyCollection<FuncionarioDto>> GetAllAsync();
    Task<FuncionarioDto?> CreateAsync(CrearFuncionarioDto dto);
    Task<bool> DeleteAsync(string mail);
}
