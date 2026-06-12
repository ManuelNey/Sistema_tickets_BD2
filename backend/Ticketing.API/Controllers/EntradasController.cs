using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

using Ticketing.API.Services;

namespace Ticketing.API.Controllers;


[ApiController]


[Route("api/[controller]")]
// Por la ruta "api/[controller]", este controller responde en /api/entradas.
public class EntradasController : ControllerBase
{
    private readonly IEntradaRepository _entradaRepository;
    private readonly IJwtService _jwtService;

    public EntradasController(IEntradaRepository entradaRepository, IJwtService jwtService)
    {
        _entradaRepository = entradaRepository;
        _jwtService = jwtService;
    }


    [HttpGet("disponibles/{idHabilita:int}")]
    [Authorize(Roles = "usuario")]
    // GET /api/entradas/disponibles/{idHabilita}
    // Devuelve cuántas entradas quedan disponibles para una habilita antes de comprar
    public async Task<ActionResult<DisponibilidadDto>> GetDisponibilidad(int idHabilita)
    {
        var disponibilidad = await _entradaRepository.GetDisponibilidadAsync(idHabilita);
        if (disponibilidad == null)
            return NotFound(new { message = "Habilitación no encontrada" });

        return Ok(disponibilidad);
    }

    [HttpPost("{idEntrada:int}/Qr")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> GenerarQr(int idEntrada)
    {
        var mail = User.FindFirstValue("mail");

        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        var entrada = await _entradaRepository.ObtenerEntradaDto(idEntrada, mail);

        if (entrada == null)
            return NotFound(new { message = "Entrada no encontrada para este usuario" });

        if (entrada.Estado != "activa")
            return BadRequest(new { message = "La entrada no está activa" });

        var tokenQr = _jwtService.GenerateQrToken(idEntrada, mail);

        var qrContenido =
            $"http://192.168.1.23:8080/api/Entradas/ScanQr?token={Uri.EscapeDataString(tokenQr)}";

        return Ok(new
        {
            entradaId = idEntrada,
            qrContenido,
            expiraEn = 30
        });
    }

    [HttpGet("codigosQr")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult<IReadOnlyCollection<EntradaCodigoQrDto>>> GetCodigosQr()
    {
        var mail = User.FindFirstValue("mail");

        if (mail == null)
            return Unauthorized();

        var entradas = await _entradaRepository.ObtenerEntradasQr(mail);

        return Ok(entradas);
    }

    [HttpPost("ScanQr")]
    [Authorize(Roles = "funcionario")]
    public async Task<IActionResult> ScanQr([FromQuery] string token)
    {
        var mailFuncionario = User.FindFirstValue("mail");

        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Token inválido" });

        var datosQr = _jwtService.GetDataOnQrToken(token);

        if (datosQr == null)
            return BadRequest(new { message = "Token QR inválido o expirado" });

        var datos = datosQr.Value;
        var entradaId = datos.entradaId;
        var mailUsuario = datos.mail;

        var actualizada = await _entradaRepository.MarcarEntradaComoUtilizadaAsync(
            entradaId,
            mailUsuario,
            mailFuncionario
        );

        if (!actualizada)
            return BadRequest(new { message = "La entrada no existe, no pertenece al usuario o ya fue utilizada" });

        return Ok(new
        {
            mensaje = "Entrada validada correctamente",
            entradaId,
            mailUsuario,
            validadaPor = mailFuncionario
        });
    }
}