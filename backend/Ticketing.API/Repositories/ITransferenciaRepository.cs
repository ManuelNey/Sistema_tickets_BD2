using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ITransferenciaRepository
{
    Task<IReadOnlyCollection<TransferenciasEnviadasDto>> GetAllAsync(string mailEmisor);
}
