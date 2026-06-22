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

    [HttpGet("mis-entradas")]
    [Authorize(Roles = "usuario")]
    // GET /api/entradas/mis-entradas
    // Entradas que el usuario posee (disponibles + enviadas pendientes), agrupadas por partido+sector.
    public async Task<ActionResult<List<MisEntradasGrupoDto>>> MisEntradas()
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        var entradas = await _entradaRepository.GetMisEntradasAsync(mail);
        return Ok(entradas);
    }

    [HttpPost("transferir")]
    [Authorize(Roles = "usuario")]
    // POST /api/entradas/transferir
    // Envía 'cantidad' entradas de un grupo (habilita) al receptor. El back elige las entradas.
    public async Task<ActionResult> Transferir([FromBody] TransferirEntradaRequest request)
    {
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        try
        {
            var enviadas = await _entradaRepository.TransferirAsync(
                request.IdHabilita, request.Cantidad, mail, request.ReceptorMail);
            return Ok(new { enviadas });
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

    [HttpPost("{idEntrada:int}/Qr")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> GenerarQr(int idEntrada)
    {
        var mail = User.FindFirstValue("mail");

        if (mail == null)
            return Unauthorized(new { message = "Usuario no autenticado" });

        var entrada = await _entradaRepository.ObtenerEntrada(idEntrada, mail);

        if (entrada == null)
            return NotFound(new { message = "Entrada no encontrada para este usuario" });

        if (entrada.Estado != "activa")
            return BadRequest(new { message = "La entrada no está activa" });

        var tokenQr = _jwtService.GenerateQrToken(idEntrada, mail);

        var qrContenido =
                    $"/api/Entradas/ScanQr?token={Uri.EscapeDataString(tokenQr)}";
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
    public async Task<IActionResult> ScanQr(
        [FromQuery] string token,
        [FromQuery] string deviceId)
    {
        var mailFuncionario = User.FindFirstValue("mail");

        if (string.IsNullOrWhiteSpace(mailFuncionario))
            return Unauthorized(new { message = "Funcionario no autenticado" });

        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Token inválido" });

        if (string.IsNullOrWhiteSpace(deviceId))
            return BadRequest(new { message = "Dispositivo no informado" });

        var datosQr = _jwtService.GetDataOnQrToken(token);

        if (datosQr == null)
            return BadRequest(new { message = "Token QR inválido o expirado" });

        var datos = datosQr.Value;
        var entradaId = datos.entradaId;
        var mailUsuario = datos.mail;

        var funcionarioAutorizado =
            await _entradaRepository.FuncionarioPuedeValidarEntradaAsync(
                entradaId,
                mailFuncionario
            );

        if (!funcionarioAutorizado)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                message = "El funcionario no está habilitado para validar entradas de este sector."
            });
        }

        var actualizada = await _entradaRepository.MarcarEntradaComoUtilizadaAsync(
            entradaId,
            mailUsuario,
            mailFuncionario,
            token,
            deviceId
        );

        if (!actualizada)
        {
            return BadRequest(new
            {
                message = "La entrada no existe, no pertenece al usuario o ya fue utilizada"
            });
        }

        return Ok(new
        {
            mensaje = "Entrada validada correctamente",
            entradaId,
            mailUsuario,
            validadaPor = mailFuncionario,
            dispositivo = deviceId
        });
    }
}