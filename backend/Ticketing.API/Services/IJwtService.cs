using Ticketing.API.Dtos;

namespace Ticketing.API.Services;

public interface IJwtService
{
    string GenerateToken(UsuarioResponseDto usuario);
}
