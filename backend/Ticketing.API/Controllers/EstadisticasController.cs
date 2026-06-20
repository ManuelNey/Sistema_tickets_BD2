using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;


[ApiController]


[Route("api/[controller]")]

public class EstadisticasController : ControllerBase
{
    private readonly IEstadisticasRepository _estadisticasRepository;

    public EstadisticasController(IEstadisticasRepository estadisticasRepository)
    {
        _estadisticasRepository = estadisticasRepository;
    }
    [HttpGet("TopEncuentros")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<TopEncuentrosMasVendidosDto>>> GetAllAsync()
    {
        var encuentros = await _estadisticasRepository.GetAllAsync();
        return Ok(encuentros);
    }

    [HttpGet("TopUsuarios")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<TopUsuariosMasEntradasCompradasDto>>> GetAllUsers()
    {
        var usuarios = await _estadisticasRepository.GetAllUsers();
        return Ok(usuarios);
    }

    [HttpGet("Canceladas")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<PorcentajeCanceladasDto>> GetPorcentajeCanceladas()
    {
        var porcentaje = await _estadisticasRepository.GetPorcentajeCanceladas();
        return Ok(porcentaje);
    }

}
