using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;
using Microsoft.AspNetCore.Authorization;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuMatchController : ControllerBase
{
    private readonly IMenuMatchDtoRepository _menuMatchRepo;

    public MenuMatchController(IMenuMatchDtoRepository menuMatchRepo)
    {
        _menuMatchRepo = menuMatchRepo;
    }

    [HttpGet("matches")]
    [Authorize(Roles = "admin,usuario")]
    // GET /api/MenuMatch/matches
    // Muestra el menú de partidos disponibles, con información de estadio, equipos y fecha.
    public async Task<ActionResult<IReadOnlyCollection<EncuentroMenuDto>>> GetMenuMatches()
    {
        var matches = await _menuMatchRepo.GetMenuMatchesAsync();
        return Ok(matches);
    }
}