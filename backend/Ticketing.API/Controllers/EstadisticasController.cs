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

    // Obtiene los encuentros con mayor cantidad de entradas vendidas.
    [HttpGet("TopEncuentros")]
    [Authorize (Roles = "admin")]
    public async Task<ActionResult<IReadOnlyCollection<TopEncuentrosMasVendidosDto>>> GetAllAsync(
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        // Se ajustan las fechas recibidas para filtrar correctamente
        var fechas = NormalizarRango(desde, hasta);

        // Se consultan los datos mediante el repositorio
        var encuentros = await _estadisticasRepository.GetAllAsync(fechas.Desde, fechas.Hasta);
        return Ok(encuentros);
    }

    // Obtiene los usuarios que compraron más entradas
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

    // Obtiene el porcentaje de entradas canceladas dentro de un período
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

    // Obtiene la cantidad de entradas vendidas por estadio
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

    // Obtiene los usuarios que realizaron más transferencias de entradas
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

    // Método auxiliar para preparar el rango de fechas usado en las consultas
    private static (DateTime? Desde, DateTime? Hasta) NormalizarRango(DateTime? desde, DateTime? hasta)
    {
        return (desde?.Date, hasta?.Date.AddDays(1));
    }

}
