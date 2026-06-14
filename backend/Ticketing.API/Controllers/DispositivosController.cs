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
}