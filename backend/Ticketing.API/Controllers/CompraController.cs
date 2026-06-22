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
    //  Acepta uno o varios sectores en la misma lista; todos quedan en una sola compra y transacción.
    [HttpPost("reservar")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> Reservar([FromBody] List<ReservarEntradaRequest> items)
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        //Control de errores que puede disparar el repository
        try
        {
            var idCompra = await _compraRepository.ReservarAsync(items, mail);
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

    // Listado de todas las reservas/compras del usuario autenticado (cualquier estado).
    [HttpGet("mis-reservas")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> MisReservas()
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        var reservas = await _compraRepository.GetMisReservasAsync(mail);
        return Ok(reservas);
    }

    // Reservas pendientes de pago del usuario (las que se muestran por defecto en el front).
    [HttpGet("mis-reservas/pendientes")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> MisReservasPendientes()
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        var reservas = await _compraRepository.GetMisReservasAsync(mail, "pendiente");
        return Ok(reservas);
    }

    // Compras ya pagadas del usuario (segunda solapa del front).
    [HttpGet("mis-reservas/pagadas")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> MisReservasPagadas()
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        var reservas = await _compraRepository.GetMisReservasAsync(mail, "pagada");
        return Ok(reservas);
    }

    // Detalle de una reserva/compra puntual (valida que sea del usuario autenticado).
    [HttpGet("{idCompra:int}")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> Detalle(int idCompra)
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        var compra = await _compraRepository.GetCompraDetalleAsync(idCompra, mail);
        if (compra == null)
            return NotFound(new { message = "La compra no existe" });

        return Ok(compra);
    }
}
