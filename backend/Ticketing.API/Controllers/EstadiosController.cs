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
    //User y admin
    [HttpGet]
    // GET /api/estadios
    // Pide todos los estadios al repositorio
    public async Task<ActionResult<IReadOnlyCollection<EstadioDto>>> GetAll()
    {
        var estadios = await _estadioRepository.GetAllAsync();
        return Ok(estadios);
    }

    //Solo admin
    [HttpPost("registro")]
    public async Task<ActionResult<EstadioDto>> CreateAsync([FromBody] CrearEstadioDto estadio)
    {

        var estadioCreado = await _estadioRepository.CreateAsync(estadio);
        
        return CreatedAtAction(nameof(GetAll), new { id = estadioCreado.Id }, estadioCreado);

    }

    //Solo admin
    [HttpPut("{id:int}")]
    public async Task<ActionResult<EstadioDto>> UpdateAsync(int id, [FromBody] ActualizarEstadioDto estadio)
    {

        var estadioActualizado = await _estadioRepository.UpdateAsync(id, estadio);

        if (estadioActualizado == null)
        {
            return NotFound();
        }
        
        return Ok(estadioActualizado);
    }
}
