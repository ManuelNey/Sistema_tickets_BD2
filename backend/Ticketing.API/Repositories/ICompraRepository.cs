using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface ICompraRepository
{
    Task<int> ReservarAsync(List<ReservarEntradaRequest> items, string mail);
    Task<bool> ConfirmarCompraAsync(int idCompra, string mail);
    Task<bool> CancelarCompraAsync(int idCompra, string mail);
    Task<CompraDetalleDto?> GetCompraDetalleAsync(int idCompra, string mail);
    // estado: si viene null devuelve todas; si viene 'pendiente'/'pagada'/'cancelada' filtra por ese estado.
    Task<List<CompraDetalleDto>> GetMisReservasAsync(string mail, string? estado = null);
}
