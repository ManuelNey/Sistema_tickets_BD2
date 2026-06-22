using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IComisionRepository
{
    Task<ComisionVigenteDto?> GetVigenteAsync();
    Task<IReadOnlyCollection<ComisionDto>> GetAllAsync();
    Task CreateAsync(CrearComisionDto dto);
    // Retorna false si la comisión ya está asociada a compras (no se puede borrar).
    Task<bool?> DeleteAsync(int id);
}
