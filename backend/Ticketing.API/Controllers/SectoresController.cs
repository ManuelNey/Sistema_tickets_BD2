using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;


[ApiController]


[Route("api/[controller]")]
public class SectoresController : ControllerBase
{
    private readonly ISectorRepository _sectorRepository;

    public SectoresController(ISectorRepository sectorRepository)
    {
        _sectorRepository = sectorRepository;
    }

    // Obtiene los sectores pertenecientes a un estadio
    [HttpGet("{id:int}")]
    [Authorize (Roles = "admin,usuario")]
    public async Task<ActionResult<IReadOnlyCollection<SectorDto>>> GetAll(int id)
    {
        var sectores = await _sectorRepository.GetAllAsync(id);
        return Ok(sectores);
    }

    // Registra un sector dentro de un estadio del país sede del administrador
    [HttpPost("registro")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<SectorDto>> CreateAsync([FromBody] CrearSectorDto sector)
    {
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        var sectorCreado = await _sectorRepository.CreateAsync(sector, paisSedeId);

        // Puede fallar si el estadio no pertenece al país o ya tiene el máximo de sectores
        if (sectorCreado == null)
        {
            return Forbid();
        }
        
        return CreatedAtAction(nameof(GetAll), new { id = sectorCreado.Id }, sectorCreado);
    }

    // Actualiza los datos de un sector
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<SectorDto>> UpdateAsync(int id, [FromBody] ActualizarSectorDto sector)
    {
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        // El repositorio valida que el sector pertenezca a un estadio de su país
        var sectorActualizado = await _sectorRepository.UpdateAsync(id, sector, paisSedeId);

        if (sectorActualizado == null)
        {
            return NotFound();
        }
        
        return Ok(sectorActualizado);
    }

    // Elimina un sector de un estadio
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        var sectorEliminado = await _sectorRepository.DeleteAsync(id, paisSedeId);

        if (!sectorEliminado)
        {
            return NotFound();
        }
        
        return NoContent();
    }
}
