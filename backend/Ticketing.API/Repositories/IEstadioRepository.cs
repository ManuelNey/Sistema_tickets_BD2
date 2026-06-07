using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IEstadioRepository
{
    Task<IReadOnlyCollection<EstadioDto>> GetAllAsync();
    Task<EstadioDto> CreateAsync(CrearEstadioDto estadio);
    Task<EstadioDto> UpdateAsync(int id, ActualizarEstadioDto estadio);
}
