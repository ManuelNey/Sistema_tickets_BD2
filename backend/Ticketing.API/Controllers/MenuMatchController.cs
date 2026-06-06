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
    [Authorize]
    public async Task<ActionResult<IReadOnlyCollection<MenuMatchDto>>> GetMenuMatches()
    {
        var matches = await _menuMatchRepo.GetMenuMatchesAsync();
        return Ok(matches);
    }
}