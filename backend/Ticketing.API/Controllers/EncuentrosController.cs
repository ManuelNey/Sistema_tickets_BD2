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
    [Authorize(Roles = "usuario")]
    // GET /api/encuentros/{idEncuentro}/sectores
    // Devuelve los sectores habilitados del encuentro con precio y cupos disponibles
    public async Task<ActionResult<IReadOnlyCollection<SectorDisponibleDto>>> GetSectores(int idEncuentro)
    {
        var sectores = await _encuentroRepository.GetSectoresByEncuentroAsync(idEncuentro);
        return Ok(sectores);
    }
}
