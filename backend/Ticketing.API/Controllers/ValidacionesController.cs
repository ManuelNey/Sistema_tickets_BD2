using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class ValidacionesController : ControllerBase
{
    private readonly IValidacionRepository _validacionRepository;

    public ValidacionesController(IValidacionRepository validacionRepository)
    {
        _validacionRepository = validacionRepository;
    }

    // Obtiene un resumen de las validaciones de entradas para el país sede del usuario autenticado
    [HttpGet("resumen")]
    public async Task<ActionResult<ValidacionResumenDto>> GetResumen()
    {
        if (!TryGetPaisSede(out var paisSedeId)) // Intentamos obtener el pais sede del usuario autenticado desde el token.
            return Forbid();

        var resumen = await _validacionRepository.GetResumenAsync(paisSedeId);
        return Ok(resumen);
    }

    [HttpGet]
    // Obtiene una lista de validaciones de entradas para el país sede del usuario autenticado, con filtros opcionales
    public async Task<ActionResult<ValidacionesListaDto>> GetValidaciones(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] int? estadioId,
        [FromQuery] string? funcionarioMail,
        [FromQuery] int numeroPagina = 1,
        [FromQuery] int cantidadPorPagina = 20)
    {
        if (!TryGetPaisSede(out var paisSedeId))
            return Forbid();

        if (numeroPagina < 1) 
        {
            numeroPagina = 1;
        }
        // Limita la cantidad de resultados por página a un rango si realista
        if (cantidadPorPagina < 1 || cantidadPorPagina > 100)
        {
            cantidadPorPagina = 20;
        } 

        var lista = await _validacionRepository.GetValidacionesAsync(
            paisSedeId, desde, hasta, estadioId, funcionarioMail, numeroPagina, cantidadPorPagina);

        return Ok(lista);
    }

    // Método auxiliar para obtener el país sede del usuario autenticado desde su token
    private bool TryGetPaisSede(out int paisSedeId)
    {
        paisSedeId = 0;
        var claim = User.FindFirstValue("pais_sede");
        return claim != null && int.TryParse(claim, out paisSedeId);
    }
}
