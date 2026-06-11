using Ticketing.API.DTOs;

namespace Ticketing.API.Services;

public interface IJwtService
{
    string GenerateToken(UsuarioResponseDto usuario);

    string GenerateQrToken(int idEntrada, string mailUsuario);
}
