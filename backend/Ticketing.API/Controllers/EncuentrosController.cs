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

    // Devuelve los sectores habilitados para un encuentro específico.
    // Incluye información como precio y cupos disponibles.
    [HttpGet("{idEncuentro:int}/sectores")]
    [Authorize(Roles = "admin,usuario")]
    // GET /api/encuentros/{idEncuentro}/sectores
    // Devuelve los sectores habilitados del encuentro con precio y cupos disponibles
    public async Task<ActionResult<IReadOnlyCollection<SectorDisponibleDto>>> GetSectores(int idEncuentro)
    {
        var sectores = await _encuentroRepository.GetSectoresByEncuentroAsync(idEncuentro);
        return Ok(sectores);
    }

     // Devuelve todos los encuentros registrados en el sistema.
    [HttpGet]
    // GET /api/encuentros
    public async Task<ActionResult<IReadOnlyCollection<EncuentroDto>>> GetAllEncuentros()
    {
        var encuentros = await _encuentroRepository.GetAllEncuentros();
        return Ok(encuentros);
    }

    // Crea un nuevo encuentro.
    // Solo puede ser ejecutado por administradores.
    [HttpPost("registro")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<EncuentroDto>> CreateAsync([FromBody] CrearEncuentroDto encuentro)
    {
        // Se obtiene el mail del administrador desde el token.
        var mailAdmin = User.FindFirst("mail")?.Value;
        // Se obtiene el país sede del administrador desde el token.
        var paisSedeClaim = User.FindFirst("pais_sede")?.Value;

        // Si no hay mail en el token, no se permite crear el encuentro.
        if (string.IsNullOrWhiteSpace(mailAdmin))
        {
            return Forbid();
        }

        // Si el país sede no es válido, no se permite la operación.
        if (!int.TryParse(paisSedeClaim, out var paisSedeId))
        {
            return Forbid();
        }

        try
        {   
            // Se delega la creación del encuentro al repositorio.
            var encuentroCreado = await _encuentroRepository.CreateAsync(encuentro, mailAdmin, paisSedeId);

             // Si el repositorio devuelve null, significa que el admin no tiene permiso
            // para crear el encuentro en ese estadio.
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
        catch (InvalidOperationException ex)
        {
            // Errores de validación del negocio, como conflictos de horario.
            return BadRequest(new { message = ex.Message });
        }
    }

    // Modifica un encuentro existente.
    // Solo los administradores pueden ejecutar esta acción.
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

         // Se delega la modificación al repositorio.
        var encuentroActualizado = await _encuentroRepository.UpdateAsync(id, encuentro, paisSedeId, mailAdmin);

        // Si no se pudo actualizar, se devuelve NotFound.
        if (encuentroActualizado == null)
        {
            return NotFound();
        }

        return Ok(encuentroActualizado);
    }

    // Devuelve el detalle de un encuentro por su id.
    [HttpGet("{idEncuentro:int}")]
    // GET /api/encuentros/id
    public async Task<ActionResult<IReadOnlyCollection<EncuentroDetalleDto>>> GetEncuentroById(int idEncuentro)
    {
        var encuentro = await _encuentroRepository.GetEncuentroById(idEncuentro);

        if (encuentro == null)
        {
            return NotFound();
        }

        return Ok(encuentro);
    }
}
