using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;


[ApiController]


[Route("api/[controller]")]
// Por la ruta "api/[controller]", este controller responde en /api/estadios.
public class EstadiosController : ControllerBase
{
    private readonly IEstadioRepository _estadioRepository;

    public EstadiosController(IEstadioRepository estadioRepository)
    {
        _estadioRepository = estadioRepository;
    }
    [HttpGet]
    [Authorize (Roles = "admin,usuario")]
    // GET /api/estadios
    // Pide todos los estadios al repositorio
    public async Task<ActionResult<IReadOnlyCollection<EstadioDto>>> GetAll()
    {
        var estadios = await _estadioRepository.GetAllAsync();
        return Ok(estadios);
    }

    [HttpPost("registro")]
    [Authorize(Roles = "admin")]
    // POST /api/estadios/registro
    public async Task<ActionResult<EstadioDto>> CreateAsync([FromBody] CrearEstadioDto estadio)
    {

        var estadioCreado = await _estadioRepository.CreateAsync(estadio);
        
        return CreatedAtAction(nameof(GetAll), new { id = estadioCreado.Id }, estadioCreado);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    // PUT /api/estadios/{id}
    public async Task<ActionResult<EstadioDto>> UpdateAsync(int id, [FromBody] ActualizarEstadioDto estadio)
    {

        var estadioActualizado = await _estadioRepository.UpdateAsync(id, estadio);

        if (estadioActualizado == null)
        {
            return NotFound();
        }
        
        return Ok(estadioActualizado);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    // Delete /api/estadios/{id}
    public async Task<IActionResult> DeleteAsync(int id)
    {

        var estadioEliminado = await _estadioRepository.DeleteAsync(id);

        if (!estadioEliminado)
        {
            return NotFound();
        }
        
        return NoContent();
    }
}
