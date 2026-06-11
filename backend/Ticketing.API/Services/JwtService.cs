using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Ticketing.API.DTOs;

namespace Ticketing.API.Services;

public class JwtService : IJwtService
{
    private readonly SymmetricSecurityKey _signingKey;
    private readonly int _expirationHours;

    public JwtService(IConfiguration configuration)
    {
        var keyString = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key not configured in appsettings.");
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        _expirationHours = int.TryParse(configuration["Jwt:ExpirationHours"], out var h) ? h : 1;
    }

    public string GenerateToken(UsuarioResponseDto usuario)
    {
        var claims = new List<Claim>
        {
            new Claim("mail", usuario.Mail),
            new Claim("nombre", usuario.Nombre),
            new Claim("apellido", usuario.Apellido),
            new Claim("rol", usuario.Rol)
        };

        if (usuario.PaisSede.HasValue)
            claims.Add(new Claim("pais_sede", usuario.PaisSede.Value.ToString()));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims.ToArray()),
            Expires = DateTime.UtcNow.AddHours(_expirationHours),
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(tokenDescriptor));
    }

        public string GenerateQrToken(int idEntrada, string mailUsuario)
    {
        var claims = new List<Claim>
        {
            new Claim("entradaId", idEntrada.ToString()),
            new Claim("mail", mailUsuario),
            new Claim("tipo", "qr_entrada")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims.ToArray()),

            // el QR (Token) vence en 30 segundos.
            Expires = DateTime.UtcNow.AddSeconds(30),

            SigningCredentials = new SigningCredentials(
                _signingKey,
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var handler = new JwtSecurityTokenHandler();

        return handler.WriteToken(handler.CreateToken(tokenDescriptor));
    }
}
