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

    public FuncionariosController(IFuncionarioRepository funcionarioRepository)
    {
        _funcionarioRepository = funcionarioRepository;
    }

    [HttpGet("admin")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<FuncionarioDto>>> GetFuncionariosDelPaisAdmin()
    {
        var funcionarios = await _funcionarioRepository.GetAllAsync();

        return Ok(funcionarios);
    }
}
