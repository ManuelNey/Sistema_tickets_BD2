using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ICompraRepository
{
    Task<int> ReservarAsync(ReservarEntradaRequest request, string mail);   
    Task<bool> ConfirmarCompraAsync(int idCompra, string mail);  
    Task<bool> CancelarCompraAsync(int idCompra, string mail);
}
