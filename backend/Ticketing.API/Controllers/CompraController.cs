using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;


[ApiController]
[Route("api/[controller]")]
// Por la ruta "api/[controller]", este controller responde en /api/compra.
public class CompraController : ControllerBase
{
    private readonly ICompraRepository _compraRepository;

    public CompraController(ICompraRepository compraRepository)
    {
        _compraRepository = compraRepository;
    }

    //  Crea la compra 'pendiente' con sus entradas 'reservada'.
    [HttpPost("reservar")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> Reservar([FromBody] ReservarEntradaRequest request)
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        //Control de errores que puede disparar el repository
        try
        {
            var idCompra = await _compraRepository.ReservarAsync(request, mail);
            return Ok(new { idCompra });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

     //  pagar o confirmar. Pasa la compra a 'pagada' y sus respectivas entradas a 'activa'.
    [HttpPost("{idCompra:int}/confirmar")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> Confirmar(int idCompra)
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        //Control de errores que puede disparar el repository
        try
        {
            await _compraRepository.ConfirmarCompraAsync(idCompra, mail);
            return Ok(new { message = "Compra confirmada" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // Cancela una reserva pendiente y libera el cupo (elimina las entradas relacionadas)
    [HttpPost("{idCompra:int}/cancelar")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> Cancelar(int idCompra)
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        //Control de errores que puede disparar el repository
        try
        {
            await _compraRepository.CancelarCompraAsync(idCompra, mail);
            return Ok(new { message = "Compra cancelada" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
