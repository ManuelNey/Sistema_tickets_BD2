using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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

    // Registra un nuevo usuario en el sistema
    [HttpPost("registro")]
    public async Task<IActionResult> Registro([FromBody] RegistroDto registro)
    {
        // Verifica que los datos recibidos sean válidos
        if (!ModelState.IsValid){
            return BadRequest(ModelState);
        }
        
        // Evita registrar correos que ya existen
        if (await _usuarioRepository.ExistsAsync(registro.Mail)){
            return BadRequest(new { message = "El correo ya está registrado" });
        }

        // Crea el usuario y luego obtiene sus datos
        await _usuarioRepository.CreateAsync(registro);

        var usuario = await _usuarioRepository.GetByMailAsync(registro.Mail);
        if (usuario == null){
            return StatusCode(500, new { message = "Error al crear el usuario" });
        }

        // Genera el token para que el usuario quede autenticado
        usuario.Token = _jwtService.GenerateToken(usuario);

        return CreatedAtAction(nameof(GetPerfil), new { mail = usuario.Mail }, usuario);
    }

    // Permite iniciar sesión con correo y contraseña
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto login)
    {
        if (!ModelState.IsValid){
            return BadRequest(ModelState);
        }

        // Valida las credenciales del usuario
        var usuario = await _usuarioRepository.AuthenticateAsync(login.Mail, login.Contrasena);
        if (usuario == null){
            return Unauthorized(new { message = "Correo o contraseña inválidos" });
        }

        // Devuelve los datos del usuario junto con su token
        usuario.Token = _jwtService.GenerateToken(usuario);

        return Ok(usuario);
    }

    // Obtiene la información del perfil de un usuario autenticado
    [HttpGet("perfil/{mail}")]
    [Authorize]
    public async Task<IActionResult> GetPerfil(string mail)
    {
        var mailToken = User.FindFirstValue("mail");

        if (mailToken != mail){
            return Forbid();
        }

        var usuario = await _usuarioRepository.GetByMailAsync(mail);
        if (usuario == null)
            return NotFound(new { message = "Usuario no encontrado" });

        return Ok(usuario);
    }

    // Actualiza los datos personales y, opcionalmente, la contraseña del usuario
    [HttpPut("perfil/{mail}")]
    [Authorize]
    public async Task<IActionResult> ActualizarPerfil(string mail, [FromBody] ActualizarPerfilDto perfil){
        if (!ModelState.IsValid){
            return BadRequest(ModelState);
        }
        
        var mailToken = User.FindFirstValue("mail");

        if (mailToken != mail){
            return Forbid();
        }
        
        // Detecta si el usuario desea modificar su contraseña
        var quiereCambiarContrasena =
            !string.IsNullOrWhiteSpace(perfil.ContrasenaActual) ||
            !string.IsNullOrWhiteSpace(perfil.NuevaContrasena) ||
            !string.IsNullOrWhiteSpace(perfil.ConfirmarNuevaContrasena);

        if (quiereCambiarContrasena){
            // Valida que se hayan completado correctamente los campos de contraseña
            if (string.IsNullOrWhiteSpace(perfil.ContrasenaActual)){
                return BadRequest(new{message = "Debés ingresar la contraseña actual."});
            }

            if (string.IsNullOrWhiteSpace(perfil.NuevaContrasena)){
                return BadRequest(new{message = "Debés ingresar la nueva contraseña."});
            }

            if (perfil.NuevaContrasena.Length < 6){
                return BadRequest(new{message = "La nueva contraseña debe tener al menos 6 caracteres."});
            }

            if (perfil.NuevaContrasena != perfil.ConfirmarNuevaContrasena){
                return BadRequest(new{message = "La nueva contraseña y su confirmación no coinciden."});
            }

            // Comprueba que la contraseña actual ingresada sea correcta
            var contrasenaActualCorrecta = await _usuarioRepository.ValidarContrasenaActualAsync(mail, perfil.ContrasenaActual);

            if (!contrasenaActualCorrecta){
                return BadRequest(new{message = "La contraseña actual es incorrecta."});
            }
        }

        // Envía los cambios al repositorio
        var actualizado = await _usuarioRepository.UpdateProfileAsync(mail, perfil);

        if (!actualizado){
            return NotFound(new{message = "No se encontró el usuario."});
        }

        // Devuelve un mensaje según se haya actualizado o no la contraseña
        return Ok(new{message = quiereCambiarContrasena
                ? "Perfil y contraseña actualizados correctamente."
                : "Perfil actualizado correctamente."});
    }
}
