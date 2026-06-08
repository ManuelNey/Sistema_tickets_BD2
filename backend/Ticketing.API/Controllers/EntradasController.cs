using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

//Token QR
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
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


    [HttpGet]
    [Authorize (Roles = "admin,usuario")]
    // GET /api/entradas
    // Pide todas las entradas al repositorio
    public async Task<ActionResult<IReadOnlyCollection<ComprarEntradaResponse>>> GetAll()
    {
        var entradas = await _entradaRepository.GetAllAsync();
        return Ok(entradas);
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

    [HttpPost("compra")]
    [Authorize(Roles = "usuario")]
    // POST /api/entradas/compra
    public async Task<ActionResult<ComprarEntradaResponse>> CreateAsync([FromBody] ComprarEntradaRequest request)
    {
        // el mail del usuario se lee del claim del JWT, no del body
        var mail = User.FindFirstValue("mail");
        if (mail == null)
            return Unauthorized();

        var entradaCreada = await _entradaRepository.CreateAsync(request.IdHabilita, request.Cantidad, mail);
        return CreatedAtAction(nameof(GetAll), null, entradaCreada);
    }
    


    [HttpPost("{id_Entrada:int}/qr")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult> GenerarQr(int idEntrada)
{
    var mail = User.FindFirstValue("mail");

    if (mail == null)
        return Unauthorized(new { message = "Usuario no autenticado" });

    var entrada = await _entradaRepository.ObtenerEntradaDto(idEntrada);

    if (entrada == null)
        return NotFound(new { message = "Entrada no encontrada para este usuario" });

    if (entrada.Estado != "activa")
        return BadRequest(new { message = "La entrada no está activa" });

    var tokenQr = _jwtService.GenerateQrToken(idEntrada, mail);

    var qrContenido = $"http://localhost:8080/validarEntrada?token={Uri.EscapeDataString(tokenQr)}";

    return Ok(new
    {
        entradaId = idEntrada,
        qrContenido,
        expiraEn = 30
    });
}

}