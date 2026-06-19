using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IEstadisticasRepository
{
    Task<IReadOnlyCollection<TopEncuentrosMasVendidosDto>> GetAllAsync();
}
