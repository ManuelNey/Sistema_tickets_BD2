using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ITransferenciaRepository
{
    Task<IReadOnlyCollection<TransferenciasEnviadasDto>> GetAllAsync(string mailEmisor);
    Task<IReadOnlyCollection<TransferenciasRecibidasDto>> GetAllReceived(string mailReceptor);
    Task<ResolverTransferenciaDto?> ResolverTransferencia(int id, ResolverTransferenciaDto transferencia, string mailReceptor);
}
