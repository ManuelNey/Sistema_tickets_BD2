using Ticketing.API.Dtos;

namespace Ticketing.API.Services;

public interface IJwtService
{
    string GenerateToken(UsuarioResponseDto usuario);

    string GenerateQrToken(int idEntrada, string mailUsuario);

    (int entradaId, string mail)? GetDataOnQrToken(string token);
}
