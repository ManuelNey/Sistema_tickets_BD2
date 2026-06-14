using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DispositivoController : ControllerBase
{
    private readonly IDispositivoRepository _dispositivoRepository;

    public DispositivoController(IDispositivoRepository dispositivoRepository)
    {
        _dispositivoRepository = dispositivoRepository;
    }

    [HttpPost("check")]
    [Authorize(Roles = "funcionario")]
    public async Task<IActionResult> CheckDevice([FromBody] CheckDeviceDto dto)
    {
        var mail = User.FindFirstValue("mail");

        if (mail == null)
            return Unauthorized(new { message = "Funcionario no autenticado" });

        if (string.IsNullOrWhiteSpace(dto.DeviceId))
            return BadRequest(new { message = "Dispositivo no informado" });

        var enabled = await _dispositivoRepository.CheckDeviceEnabled(dto.DeviceId, mail);

        if (!enabled)
            return Unauthorized(new { message = "Dispositivo no habilitado para este funcionario"});

        return Ok(new
        {
            message = "Dispositivo habilitado",
            enable = true,
        });
    }

    [HttpGet]
    // GET /api/Dispositivos
    public async Task<ActionResult<IReadOnlyCollection<DispositivoDto>>> GetDispositivos()
    {
        var dispositivos = await _dispositivoRepository.GetDispositivos();

        return Ok(dispositivos);
    }

    [HttpPost("registro")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DispositivoDto>> CreateAsync([FromBody] CrearDispositivoDto dispositivo)
    {
        var dispositivoCreado = await _dispositivoRepository.CreateAsync(dispositivo);

        if (dispositivoCreado == null)
        {
            return Forbid();
        }

        return dispositivoCreado;
    }

    [HttpPut("{numeroDispositivo}")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<DispositivoDto>> UpdateAsync(
        string numeroDispositivo,
        [FromBody] ActualizarDispositivoDto dispositivo)
    {
        var dispositivoActualizado = await _dispositivoRepository.UpdateAsync(
            numeroDispositivo,
            dispositivo
        );

        if (dispositivoActualizado == null)
        {
            return NotFound();
        }

        return Ok(dispositivoActualizado);
    }

    [HttpDelete("{numeroDispositivo}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteAsync(string numeroDispositivo)
    {
        var dispositivoEliminado = await _dispositivoRepository.DeleteAsync(numeroDispositivo);

        if (!dispositivoEliminado)
        {
            return NotFound();
        }

        return NoContent();
    }
}
