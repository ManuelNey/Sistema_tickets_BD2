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

    // Constructor que inicializa el servicio JWT con la clave de firma y la duración del token desde la configuración
    public JwtService(IConfiguration configuration)
    {
        var keyString = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT key not configured in appsettings.");
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        _expirationHours = int.TryParse(configuration["Jwt:ExpirationHours"], out var h) ? h : 1;
    }

    // Genera un token JWT para el usuario autenticado, incluyendo sus claims y la fecha de expiración
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

        // Configura el descriptor del token con los claims, la fecha de expiración y las credenciales de firma
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims.ToArray()),
            Expires = DateTime.UtcNow.AddHours(_expirationHours),
            SigningCredentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256Signature)
        };

        // Crea y devuelve el token JWT como una cadena
        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(tokenDescriptor));
    }

    // Genera un token JWT específico para el QR de entrada, con claims que incluyen el ID de la entrada y el correo del usuario, y una expiración muy corta (30 segundos)
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

    // Valida un token JWT y extrae los datos del QR de entrada si el token es válido y corresponde a un QR de entrada
    public (int entradaId, string mail)? GetDataOnQrToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();

        // Configura los parámetros de validación del token, incluyendo la clave de firma y la verificación de la expiración
        var parameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = _signingKey,
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // Intentamos validar el token y obtener el principal (claims) del mismo
        var principal = handler.ValidateToken(token, parameters, out _);

        // Verificamos que el claim "tipo" sea "qr_entrada" para asegurarnos de que es un token válido para QR de entrada
        if (principal.FindFirst("tipo")?.Value != "qr_entrada")
            return null;

        // Extraemos los claims "entradaId" y "mail" del token y los convertimos a los tipos adecuados
        var entradaIdClaim = principal.FindFirst("entradaId")?.Value;
        var mail = principal.FindFirst("mail")?.Value;

        // Validamos que el claim "entradaId" pueda convertirse a un entero y que el claim "mail" no sea nulo o vacío
        if (!int.TryParse(entradaIdClaim, out var entradaId))
            return null;

        // Validamos que el claim "mail" no sea nulo o vacío
        if (string.IsNullOrWhiteSpace(mail))
            return null;
        // Retornamos una tupla con el ID de la entrada y el correo del usuario si todo es válido
        return (entradaId, mail);
    }   
}