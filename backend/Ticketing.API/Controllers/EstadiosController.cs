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

    // Obtiene todos los estadios disponibles para administradores y usuarios
    [HttpGet]
    [Authorize (Roles = "admin,usuario")]
    public async Task<ActionResult<IReadOnlyCollection<EstadioDto>>> GetAll()
    {
        var estadios = await _estadioRepository.GetAllAsync();
        return Ok(estadios);
    }

    // Registra un estadio asociado al país sede del administrador
    [HttpPost("registro")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<EstadioDto>> CreateAsync([FromBody] CrearEstadioDto estadio)
    {
        // Obtiene el país sede desde los datos guardados en el token
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        var estadioCreado = await _estadioRepository.CreateAsync(estadio, paisSedeId);

        return CreatedAtAction(nameof(GetAll), new { id = estadioCreado.Id }, estadioCreado);
    }

    // Actualiza un estadio perteneciente al país sede del administrador
    [HttpPut("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<EstadioDto>> UpdateAsync(int id, [FromBody] ActualizarEstadioDto estadio)
    {
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        // El repositorio valida que el estadio pertenezca al país correspondiente
        var estadioActualizado = await _estadioRepository.UpdateAsync(id, estadio, paisSedeId);

        if (estadioActualizado == null)
        {
            return NotFound();
        }

        return Ok(estadioActualizado);
    }

    // Elimina un estadio del país sede del administrador
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        var estadioEliminado = await _estadioRepository.DeleteAsync(id, paisSedeId);

        if (!estadioEliminado)
        {
            return NotFound();
        }
        
        return NoContent();
    }

    // Obtiene solamente los estadios del país sede del administrador
    [HttpGet("admin")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<EstadioDto>>> GetEstadiosAdmin()
    {
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        var estadios = await _estadioRepository.GetEstadiosAdmin(paisSedeId);
        return Ok(estadios);
    }
}
