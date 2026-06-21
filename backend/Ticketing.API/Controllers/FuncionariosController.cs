using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FuncionariosController : ControllerBase
{
    private readonly IFuncionarioRepository _funcionarioRepository;
    private readonly ITrabajaEnRepository _trabajaEnRepository;

    public FuncionariosController(
        IFuncionarioRepository funcionarioRepository,
        ITrabajaEnRepository trabajaEnRepository)
    {
        _funcionarioRepository = funcionarioRepository;
        _trabajaEnRepository = trabajaEnRepository;
    }

    [HttpGet("admin")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<FuncionarioDto>>> GetFuncionariosDelPaisAdmin()
    {
        var funcionarios = await _funcionarioRepository.GetAllAsync();

        return Ok(funcionarios);
    }

    [HttpGet("encuentro/{encuentroId:int}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<TrabajaEnDto>>> GetFuncionariosPorEncuentro(int encuentroId)
    {
        var asignaciones = await _trabajaEnRepository.GetByEncuentroAsync(encuentroId);
        return Ok(asignaciones);
    }
}
