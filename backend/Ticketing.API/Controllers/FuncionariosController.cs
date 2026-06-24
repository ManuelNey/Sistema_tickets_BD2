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

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<FuncionarioDto>> CrearFuncionario([FromBody] CrearFuncionarioDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Mail) ||
            string.IsNullOrWhiteSpace(dto.Nombre) ||
            string.IsNullOrWhiteSpace(dto.Apellido) ||
            string.IsNullOrWhiteSpace(dto.Contrasena))
            return BadRequest(new { message = "Todos los campos son obligatorios. Por favor, complete todos los campos." });

        if (dto.Contrasena.Length < 6)
            return BadRequest(new { message = "La contraseña debe tener al menos 6 caracteres." });

        try
        {
            var funcionario = await _funcionarioRepository.CreateAsync(dto);

            if (funcionario == null)
                return Conflict(new { message = "El mail o el número de legajo ya están registrados." });

            return CreatedAtAction(nameof(GetFuncionariosDelPaisAdmin), funcionario);
        }
        catch
        {
            return Conflict(new { message = "El mail o el número de legajo ya están registrados." });
        }
    }

    [HttpDelete("{mail}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> EliminarFuncionario(string mail)
    {
        var eliminado = await _funcionarioRepository.DeleteAsync(mail);

        if (!eliminado)
            return NotFound(new { message = "Funcionario no encontrado." });

        return NoContent();
    }
}
