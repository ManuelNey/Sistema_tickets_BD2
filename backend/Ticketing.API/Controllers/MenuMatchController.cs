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
    // GET /api/MenuMatch/matches?equipoId=5&estadioId=3
    // Muestra el menú de partidos disponibles, con información de estadio, equipos y fecha.
    // Parámetros opcionales: equipoId (filtra partidos donde el equipo juega de local o visitante), estadioId.
    public async Task<ActionResult<IReadOnlyCollection<EncuentroMenuDto>>> GetMenuMatches(int? equipoId = null, int? estadioId = null)
    {
        var matches = await _menuMatchRepo.GetMenuMatchesAsync(equipoId, estadioId);
        return Ok(matches);
    }
}