using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;


[ApiController]
[Route("api/[controller]")]
// Por la ruta "api/[controller]", este controller responde en /api/encuentros.
public class EncuentrosController : ControllerBase
{
    private readonly IEncuentroRepository _encuentroRepository;

    public EncuentrosController(IEncuentroRepository encuentroRepository)
    {
        _encuentroRepository = encuentroRepository;
    }

    [HttpGet("{idEncuentro:int}/sectores")]
    [Authorize(Roles = "admin,usuario")]
    // GET /api/encuentros/{idEncuentro}/sectores
    // Devuelve los sectores habilitados del encuentro con precio y cupos disponibles
    public async Task<ActionResult<IReadOnlyCollection<SectorDisponibleDto>>> GetSectores(int idEncuentro)
    {
        var sectores = await _encuentroRepository.GetSectoresByEncuentroAsync(idEncuentro);
        return Ok(sectores);
    }

    [HttpGet]
    // GET /api/encuentros
    public async Task<ActionResult<IReadOnlyCollection<EncuentroDto>>> GetAllEncuentros()
    {
        var encuentros = await _encuentroRepository.GetAllEncuentros();
        return Ok(encuentros);
    }

    [HttpPost("registro")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<EncuentroDto>> CreateAsync([FromBody] CrearEncuentroDto encuentro)
    {
        var mailAdmin = User.FindFirst("mail")?.Value;
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (string.IsNullOrWhiteSpace(mailAdmin))
        {
            return Forbid();
        }

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        var encuentroCreado = await _encuentroRepository.CreateAsync(encuentro, mailAdmin, paisSedeId);

        if (encuentroCreado == null)
        {
            return Forbid();
        }

        return CreatedAtAction(
            nameof(GetAllEncuentros),
            new { id = encuentroCreado.Id },
            encuentroCreado
        );
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<EncuentroDto>> UpdateAsync(int id, [FromBody] ActualizarEncuentroDto encuentro)
    {
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        var mailAdmin = User.FindFirst("mail")?.Value;

        if (string.IsNullOrWhiteSpace(mailAdmin))
        {
            return Forbid();
        }


        var encuentroActualizado = await _encuentroRepository.UpdateAsync(id, encuentro, paisSedeId, mailAdmin);

        if (encuentroActualizado == null)
        {
            return NotFound();
        }

        return Ok(encuentroActualizado);
    }
}
