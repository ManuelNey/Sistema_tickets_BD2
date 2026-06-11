using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IUsuarioRepository
{
    Task<UsuarioResponseDto?> GetByMailAsync(string mail);
    Task<bool> ExistsAsync(string mail);
    Task CreateAsync(RegistroDto registro);
    Task<UsuarioResponseDto?> AuthenticateAsync(string mail, string contrasena);
}
