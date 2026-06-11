using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;
using Ticketing.API.Services;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuarioController : ControllerBase
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IJwtService _jwtService;

    public UsuarioController(IUsuarioRepository usuarioRepository, IJwtService jwtService)
    {
        _usuarioRepository = usuarioRepository;
        _jwtService = jwtService;
    }

    [HttpPost("registro")]
    public async Task<IActionResult> Registro([FromBody] RegistroDto registro)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (await _usuarioRepository.ExistsAsync(registro.Mail))
            return BadRequest(new { message = "El correo ya está registrado" });

        await _usuarioRepository.CreateAsync(registro);

        var usuario = await _usuarioRepository.GetByMailAsync(registro.Mail);
        if (usuario == null)
            return StatusCode(500, new { message = "Error al crear el usuario" });

        usuario.Token = _jwtService.GenerateToken(usuario);

        return CreatedAtAction(nameof(GetPerfil), new { mail = usuario.Mail }, usuario);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto login)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var usuario = await _usuarioRepository.AuthenticateAsync(login.Mail, login.Contrasena);
        if (usuario == null)
            return Unauthorized(new { message = "Correo o contraseña inválidos" });

        usuario.Token = _jwtService.GenerateToken(usuario);

        return Ok(usuario);
    }

    [HttpGet("perfil/{mail}")]
    public async Task<IActionResult> GetPerfil(string mail)
    {
        var usuario = await _usuarioRepository.GetByMailAsync(mail);
        if (usuario == null)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(usuario);
    }
}
