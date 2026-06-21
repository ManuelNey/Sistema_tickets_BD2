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
    public async Task<ActionResult<IReadOnlyCollection<TopEncuentrosMasVendidosDto>>> GetAllAsync(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var fechas = NormalizarRango(desde, hasta);
        var encuentros = await _estadisticasRepository.GetAllAsync(fechas.Desde, fechas.Hasta);
        return Ok(encuentros);
    }

    [HttpGet("TopUsuarios")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<TopUsuariosMasEntradasCompradasDto>>> GetAllUsers(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var fechas = NormalizarRango(desde, hasta);
        var usuarios = await _estadisticasRepository.GetAllUsers(fechas.Desde, fechas.Hasta);
        return Ok(usuarios);
    }

    [HttpGet("Canceladas")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<PorcentajeCanceladasDto>> GetPorcentajeCanceladas(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var fechas = NormalizarRango(desde, hasta);
        var porcentaje = await _estadisticasRepository.GetPorcentajeCanceladas(fechas.Desde, fechas.Hasta);
        return Ok(porcentaje);
    }
    [HttpGet("EntradasPorEstadio")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<EstadioEntradasDto>>> GetEstadiosEntradas(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var fechas = NormalizarRango(desde, hasta);
        var estadios = await _estadisticasRepository.GetEstadioEntradas(fechas.Desde, fechas.Hasta);
        return Ok(estadios);
    }

    [HttpGet("UsuariosTransferencias")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<TopUsuariosTransferenciaDto>>> GetUsuariosTransferencias(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var fechas = NormalizarRango(desde, hasta);
        var usuarios = await _estadisticasRepository.GetUsuariosTransferencias(fechas.Desde, fechas.Hasta);
        return Ok(usuarios);
    }

    private static (DateTime? Desde, DateTime? Hasta) NormalizarRango(DateTime? desde, DateTime? hasta)
    {
        return (desde?.Date, hasta?.Date.AddDays(1));
    }

}
