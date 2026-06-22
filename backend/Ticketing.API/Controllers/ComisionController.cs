using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
// Responde en /api/comision.
public class ComisionController : ControllerBase
{
    private readonly IComisionRepository _comisionRepository;

    public ComisionController(IComisionRepository comisionRepository)
    {
        _comisionRepository = comisionRepository;
    }

    // Comisión vigente hoy. Si no hay ninguna, devuelve porcentaje 0, solo precio base
    [HttpGet("vigente")]
    [Authorize(Roles = "admin,usuario")]
    public async Task<ActionResult> Vigente()
    {
        var comision = await _comisionRepository.GetVigenteAsync();
        if (comision == null)
            return Ok(new ComisionVigenteDto { IdComision = 0, Porcentaje = 0 });

        return Ok(comision);
    }

    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<ComisionDto>>> GetAll()
    {
        var comisiones = await _comisionRepository.GetAllAsync();
        return Ok(comisiones);
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> Create([FromBody] CrearComisionDto dto)
    {
        if (dto.Porcentaje < 0 || dto.Porcentaje > 100)
            return BadRequest(new { message = "El porcentaje debe estar entre 0 y 100" });

        if (dto.FechaFin.HasValue && dto.FechaFin < dto.FechaInicio)
            return BadRequest(new { message = "La fecha de fin no puede ser anterior a la de inicio" });

        await _comisionRepository.CreateAsync(dto);
        return Created(string.Empty, null);
    }

    // Elimina una comisión solo si no tiene compras asociadas. Si tiene compras asociadas no se elimina
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult> Delete(int id)
    {
        var result = await _comisionRepository.DeleteAsync(id);
        return result switch
        {
            null  => NotFound(new { message = "Comisión no encontrada" }),
            false => Conflict(new { message = "No se puede eliminar: la comisión ya está asociada a compras" }),
            true  => NoContent(),
        };
    }
}
