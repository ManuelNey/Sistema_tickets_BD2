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
    [HttpGet("{id:int}")]
    [Authorize (Roles = "admin,usuario")]
    // GET /api/sectores/{id_estadio}
    public async Task<ActionResult<IReadOnlyCollection<SectorDto>>> GetAll(int id)
    {
        var sectores = await _sectorRepository.GetAllAsync(id);
        return Ok(sectores);
    }

    [HttpPost("registro")]
    [Authorize(Roles = "admin")]
    // POST /api/sectores/registro
    public async Task<ActionResult<SectorDto>> CreateAsync([FromBody] CrearSectorDto sector)
    {

        var sectorCreado = await _sectorRepository.CreateAsync(sector);
        
        return CreatedAtAction(nameof(GetAll), new { id = sectorCreado.Id }, sectorCreado);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    // PUT /api/sectores/{id}
    public async Task<ActionResult<SectorDto>> UpdateAsync(int id, [FromBody] ActualizarSectorDto sector)
    {

        var sectorActualizado = await _sectorRepository.UpdateAsync(id, sector);

        if (sectorActualizado == null)
        {
            return NotFound();
        }
        
        return Ok(sectorActualizado);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    // Delete /api/sectores/{id}
    public async Task<IActionResult> DeleteAsync(int id)
    {

        var sectorEliminado = await _sectorRepository.DeleteAsync(id);

        if (!sectorEliminado)
        {
            return NotFound();
        }
        
        return NoContent();
    }
}
