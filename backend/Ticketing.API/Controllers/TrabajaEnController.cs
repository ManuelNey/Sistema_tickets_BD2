using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrabajaEnController : ControllerBase
{
    private readonly ITrabajaEnRepository _trabajaEnRepository;

    public TrabajaEnController(ITrabajaEnRepository trabajaEnRepository)
    {
        _trabajaEnRepository = trabajaEnRepository;
    }

    // Obtiene las asignaciones de funcionarios para un encuentro
    [HttpGet("encuentro/{encuentroId:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<TrabajaEnDto>>> GetByEncuentro(int encuentroId)
    {
        var asignaciones = await _trabajaEnRepository.GetByEncuentroAsync(encuentroId);
        return Ok(asignaciones);
    }

    // Asigna un funcionario a un sector habilitado para un encuentro
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> Create([FromBody] CrearTrabajaEnDto asignacion)
    {
        var creada = await _trabajaEnRepository.CreateAsync(asignacion);

        if (!creada)
        {
            return BadRequest(new { message = "No se pudo asignar el funcionario." });
        }

        return Ok(new { message = "Funcionario asignado correctamente." });
    }

    // Elimina una asignación existente de funcionario y sector
    [HttpDelete]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> Delete(
        [FromQuery] string funcionarioMail,
        [FromQuery] int habilitaId
    )
    {
        var eliminado = await _trabajaEnRepository.DeleteAsync(funcionarioMail, habilitaId);

        if (!eliminado)
        {
            return NotFound(new { message = "Asignación no encontrada." });
        }

        return NoContent();
    }
}