using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;


[ApiController]
[Route("api/[controller]")]
// Por la ruta "api/[controller]", este controller responde en /api/Paises.
public class PaisesController : ControllerBase
{
    private readonly IPaisRepository _paisRepository;

    public PaisesController(IPaisRepository paisRepository)
    {
        _paisRepository = paisRepository;
    }

    [HttpGet]
    [Authorize(Roles = "admin,usuario")]
    public async Task<ActionResult<IReadOnlyCollection<PaisDto>>> GetPaises()
    {
        var paises = await _paisRepository.GetPaises();
        return Ok(paises);
    }

}