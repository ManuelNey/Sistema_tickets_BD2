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
}
